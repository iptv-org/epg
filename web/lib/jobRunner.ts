// web/lib/jobRunner.ts
import { spawn } from 'child_process'
import { EventEmitter } from 'events'
import { JobMeta, JobStatus, writeJobMeta, appendJobLog } from '@/lib/jobStorage'
import { isRegionLocked, lockRegion, unlockRegion } from '@/lib/jobLock'

const jobEvents = new EventEmitter()
jobEvents.setMaxListeners(0)

// Job ids this process instance has actually spawned a child process for and
// not yet finalized. This is the source of truth for "is this job genuinely
// still running in this process" — it's what lets a read path distinguish a
// live job from one whose meta file says `running` only because the process
// that started it (deploy, crash, pm2 autorestart) is gone and never got to
// finalize the file. It never survives a process restart, which is exactly
// the property we need: a fresh process starts with an empty set, so any
// `running` meta file it finds on disk is provably orphaned.
const activeJobIds = new Set<string>()

/** Whether this process instance currently has a live child process for `id`. */
export function isJobActiveInProcess(id: string): boolean {
  return activeJobIds.has(id)
}

/**
 * Reconcile a job's persisted status against this process's live tracking.
 * If the meta file says `running` but this process has no live emitter for
 * it (e.g. the process restarted mid-job), it can never receive an 'exit' or
 * 'close' event for it — so report (and persist) it as `interrupted` instead
 * of leaving it `running` forever.
 */
export function reconcileJobMeta(meta: JobMeta): JobMeta {
  if (meta.status !== 'running' || activeJobIds.has(meta.id)) {
    return meta
  }
  const reconciled: JobMeta = {
    ...meta,
    status: 'interrupted',
    finishedAt: meta.finishedAt ?? new Date().toISOString()
  }
  writeJobMeta(reconciled)
  return reconciled
}

export interface StartJobOptions {
  region: string
  command: string
  args: string[]
  cwd: string
}

export type StartJobResult = { ok: true; job: JobMeta } | { ok: false; error: 'region_locked' }

export function startJob(options: StartJobOptions): StartJobResult {
  const { region, command, args, cwd } = options
  if (isRegionLocked(region)) {
    return { ok: false, error: 'region_locked' }
  }
  lockRegion(region)

  const id = `${Date.now()}-${region}`
  const meta: JobMeta = {
    id,
    region,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exitCode: null
  }
  writeJobMeta(meta)
  activeJobIds.add(id)

  const child = spawn(command, args, { cwd })

  let finalized = false

  child.stdout.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    appendJobLog(id, text)
    jobEvents.emit('line', id, text)
  })
  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    appendJobLog(id, text)
    jobEvents.emit('line', id, text)
  })

  // Finalize on 'close' rather than 'exit': 'exit' can fire before the last
  // buffered stdout/stderr 'data' events are delivered, which would emit
  // 'done' to SSE subscribers before the tail of the log has been appended
  // and forwarded, dropping the final line(s) from the live view. 'close'
  // fires only after the child's stdio streams have ended, guaranteeing all
  // 'data' events (and therefore all 'line' emits) are delivered first. Per
  // Node's docs, 'close' always fires eventually — after 'exit', or after
  // 'error' if the child failed to spawn — so it composes safely with the
  // `finalized` guard below and the separate 'error' handler.
  child.on('close', (code: number | null) => {
    if (finalized) return
    finalized = true
    activeJobIds.delete(id)
    unlockRegion(region)
    const status: JobStatus = code === 0 ? 'success' : 'failed'
    const finished: JobMeta = {
      ...meta,
      status,
      finishedAt: new Date().toISOString(),
      exitCode: code
    }
    writeJobMeta(finished)
    jobEvents.emit('done', id, finished)
  })

  child.on('error', (err: Error) => {
    if (finalized) return
    finalized = true
    activeJobIds.delete(id)
    unlockRegion(region)
    appendJobLog(id, `\n[jobRunner] failed to start process: ${err.message}\n`)
    const finished: JobMeta = {
      ...meta,
      status: 'failed',
      finishedAt: new Date().toISOString(),
      exitCode: null
    }
    writeJobMeta(finished)
    jobEvents.emit('done', id, finished)
  })

  return { ok: true, job: meta }
}

export function startJobAndWait(options: StartJobOptions): Promise<StartJobResult> {
  const result = startJob(options)
  if (!result.ok) return Promise.resolve(result)
  return new Promise(resolve => {
    const onDone = (id: string, finalMeta: JobMeta) => {
      if (id !== result.job.id) return
      jobEvents.off('done', onDone)
      resolve({ ok: true, job: finalMeta })
    }
    jobEvents.on('done', onDone)
  })
}

export function subscribeToJob(
  id: string,
  onLine: (line: string) => void,
  onDone: (meta: JobMeta) => void
): () => void {
  const lineHandler = (jobId: string, line: string) => {
    if (jobId === id) onLine(line)
  }
  const doneHandler = (jobId: string, meta: JobMeta) => {
    if (jobId === id) onDone(meta)
  }
  jobEvents.on('line', lineHandler)
  jobEvents.on('done', doneHandler)
  return () => {
    jobEvents.off('line', lineHandler)
    jobEvents.off('done', doneHandler)
  }
}
