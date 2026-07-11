// web/lib/jobRunner.test.ts
import fs from 'fs'
import os from 'os'
import path from 'path'
import { startJob, startJobAndWait, subscribeToJob, reconcileJobMeta, isJobActiveInProcess } from '@/lib/jobRunner'
import { getJobLog, getJobMeta, writeJobMeta, JobMeta } from '@/lib/jobStorage'
import { lockRegion, unlockRegion } from '@/lib/jobLock'

describe('jobRunner', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epg-jobrunner-test-'))
    process.env.EPG_DATA_DIR = tmpDir
  })

  afterEach(() => {
    delete process.env.EPG_DATA_DIR
    fs.rmSync(tmpDir, { recursive: true, force: true })
    unlockRegion('th')
    unlockRegion('no')
  })

  it('startJob rejects when the region is already locked', () => {
    lockRegion('th')
    const result = startJob({ region: 'th', command: 'node', args: ['-e', ''], cwd: tmpDir })
    expect(result).toEqual({ ok: false, error: 'region_locked' })
  })

  it('a successful job records status success, exit code 0, and captures stdout', async () => {
    const result = await startJobAndWait({
      region: 'th',
      command: 'node',
      args: ['-e', 'console.log("hello from job")'],
      cwd: tmpDir
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.job.status).toBe('success')
    expect(result.job.exitCode).toBe(0)
    expect(result.job.finishedAt).not.toBeNull()
    expect(getJobLog(result.job.id)).toContain('hello from job')
  })

  it('a failing job records status failed and a non-zero exit code', async () => {
    const result = await startJobAndWait({
      region: 'no',
      command: 'node',
      args: ['-e', 'process.exit(1)'],
      cwd: tmpDir
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.job.status).toBe('failed')
    expect(result.job.exitCode).toBe(1)
  })

  it('a spawn failure (bad command) is recorded as failed, releases the region lock, and does not crash the process', async () => {
    const result = await startJobAndWait({
      region: 'th',
      command: '/nonexistent/definitely-not-a-real-binary',
      args: [],
      cwd: tmpDir
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.job.status).toBe('failed')
    expect(result.job.exitCode).toBeNull()

    // Region lock must have been released, so a new job for the same region can start immediately.
    // Use startJobAndWait so the process fully exits before the test ends (avoids Windows file
    // locks on tmpDir from a still-running child process interfering with afterEach cleanup).
    const second = await startJobAndWait({ region: 'th', command: 'node', args: ['-e', ''], cwd: tmpDir })
    expect(second.ok).toBe(true)
  })

  it('subscribeToJob receives live log lines and a done callback', async () => {
    const lines: string[] = []
    let doneStatus: string | null = null

    const startResult = startJob({
      region: 'th',
      command: 'node',
      args: ['-e', 'console.log("live line"); process.exit(0)'],
      cwd: tmpDir
    })
    expect(startResult.ok).toBe(true)
    if (!startResult.ok) return

    await new Promise<void>(resolve => {
      const unsubscribe = subscribeToJob(
        startResult.job.id,
        line => lines.push(line),
        meta => {
          doneStatus = meta.status
          unsubscribe()
          resolve()
        }
      )
    })

    expect(lines.join('')).toContain('live line')
    expect(doneStatus).toBe('success')
  })

  it('finalizes via the close event exactly once, with all stdout delivered before done fires', async () => {
    const lines: string[] = []
    let doneCount = 0
    let doneStatus: string | null = null

    const startResult = startJob({
      region: 'th',
      command: 'node',
      args: ['-e', 'for (let i = 0; i < 50; i++) { console.log("line " + i) }'],
      cwd: tmpDir
    })
    expect(startResult.ok).toBe(true)
    if (!startResult.ok) return

    await new Promise<void>(resolve => {
      const unsubscribe = subscribeToJob(
        startResult.job.id,
        line => lines.push(line),
        meta => {
          doneCount += 1
          doneStatus = meta.status
          unsubscribe()
          resolve()
        }
      )
    })

    // The done callback must fire exactly once (the finalized guard shared
    // between the 'close' and 'error' handlers must not double-finalize),
    // and every line written before the process exited must have already
    // been delivered by the time 'done' fires (close only fires after all
    // stdio data events have been flushed).
    expect(doneCount).toBe(1)
    expect(doneStatus).toBe('success')
    expect(lines.join('')).toContain('line 49')
  })

  describe('reconcileJobMeta', () => {
    it('leaves a non-running job untouched', () => {
      const meta: JobMeta = {
        id: 'done-job',
        region: 'th',
        status: 'success',
        startedAt: '2026-07-05T00:00:00.000Z',
        finishedAt: '2026-07-05T00:01:00.000Z',
        exitCode: 0
      }
      expect(reconcileJobMeta(meta)).toEqual(meta)
    })

    it('marks a running job this process has no live emitter for as interrupted, and persists it', () => {
      const meta: JobMeta = {
        id: 'orphan-1',
        region: 'th',
        status: 'running',
        startedAt: '2026-07-05T00:00:00.000Z',
        finishedAt: null,
        exitCode: null
      }
      writeJobMeta(meta)
      expect(isJobActiveInProcess('orphan-1')).toBe(false)

      const reconciled = reconcileJobMeta(meta)
      expect(reconciled.status).toBe('interrupted')
      expect(reconciled.finishedAt).not.toBeNull()

      // The correction must be persisted to disk, not just returned, so
      // subsequent reads (and other consumers) see the corrected status too.
      expect(getJobMeta('orphan-1')?.status).toBe('interrupted')
    })

    it('leaves a job untouched while it is genuinely still running in this process', async () => {
      const startResult = startJob({
        region: 'th',
        command: 'node',
        args: ['-e', 'setTimeout(() => process.exit(0), 200)'],
        cwd: tmpDir
      })
      expect(startResult.ok).toBe(true)
      if (!startResult.ok) return

      expect(isJobActiveInProcess(startResult.job.id)).toBe(true)
      const rawMeta = getJobMeta(startResult.job.id)
      expect(rawMeta).toBeDefined()
      const reconciled = reconcileJobMeta(rawMeta!)
      expect(reconciled.status).toBe('running')

      // Let it finish naturally (rather than leaving it running past the end
      // of this test) so it doesn't hold a Windows file lock on tmpDir into
      // the next test's cleanup.
      await new Promise<void>(resolve => {
        const unsubscribe = subscribeToJob(startResult.job.id, () => {}, () => {
          unsubscribe()
          resolve()
        })
      })
      expect(isJobActiveInProcess(startResult.job.id)).toBe(false)
    })
  })
})
