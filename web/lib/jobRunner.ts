// web/lib/jobRunner.ts
import { spawn } from 'child_process'
import { EventEmitter } from 'events'
import { JobMeta, JobStatus, writeJobMeta, appendJobLog } from '@/lib/jobStorage'
import { isRegionLocked, lockRegion, unlockRegion } from '@/lib/jobLock'

const jobEvents = new EventEmitter()
jobEvents.setMaxListeners(0)

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

  child.on('exit', (code: number | null) => {
    if (finalized) return
    finalized = true
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
