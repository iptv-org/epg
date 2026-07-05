// web/lib/jobRunner.test.ts
import fs from 'fs'
import os from 'os'
import path from 'path'
import { startJob, startJobAndWait, subscribeToJob } from '@/lib/jobRunner'
import { getJobLog } from '@/lib/jobStorage'
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
})
