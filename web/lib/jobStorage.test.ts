import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  JobMeta,
  writeJobMeta,
  getJobMeta,
  listJobs,
  appendJobLog,
  getJobLog
} from '@/lib/jobStorage'
import { jobsDir } from '@/lib/paths'

describe('jobStorage', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epg-jobs-test-'))
    process.env.EPG_DATA_DIR = tmpDir
  })

  afterEach(() => {
    delete process.env.EPG_DATA_DIR
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('getJobMeta returns undefined for a job that does not exist', () => {
    expect(getJobMeta('missing')).toBeUndefined()
  })

  it('writeJobMeta then getJobMeta round-trips', () => {
    const meta: JobMeta = {
      id: '1000-th',
      region: 'th',
      status: 'running',
      startedAt: '2026-07-05T00:00:00.000Z',
      finishedAt: null,
      exitCode: null
    }
    writeJobMeta(meta)
    expect(getJobMeta('1000-th')).toEqual(meta)
  })

  it('listJobs returns an empty array when no jobs exist', () => {
    expect(listJobs()).toEqual([])
  })

  it('listJobs returns jobs newest-first by startedAt', () => {
    writeJobMeta({ id: 'a', region: 'th', status: 'success', startedAt: '2026-07-05T00:00:00.000Z', finishedAt: null, exitCode: 0 })
    writeJobMeta({ id: 'b', region: 'no', status: 'success', startedAt: '2026-07-05T00:05:00.000Z', finishedAt: null, exitCode: 0 })
    const jobs = listJobs()
    expect(jobs.map(j => j.id)).toEqual(['b', 'a'])
  })

  it('listJobs respects the limit', () => {
    writeJobMeta({ id: 'a', region: 'th', status: 'success', startedAt: '2026-07-05T00:00:00.000Z', finishedAt: null, exitCode: 0 })
    writeJobMeta({ id: 'b', region: 'no', status: 'success', startedAt: '2026-07-05T00:05:00.000Z', finishedAt: null, exitCode: 0 })
    expect(listJobs(1)).toHaveLength(1)
  })

  it('getJobLog returns an empty string when no log exists', () => {
    expect(getJobLog('missing')).toBe('')
  })

  it('appendJobLog then getJobLog round-trips and accumulates', () => {
    appendJobLog('1000-th', 'first line\n')
    appendJobLog('1000-th', 'second line\n')
    expect(getJobLog('1000-th')).toBe('first line\nsecond line\n')
  })

  it('getJobMeta returns undefined (not a throw) for a truncated/corrupt meta file', () => {
    const filePath = path.join(jobsDir(), '1000-th.json')
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, '{"id": "1000-th", "status": "runni') // truncated JSON
    expect(() => getJobMeta('1000-th')).not.toThrow()
    expect(getJobMeta('1000-th')).toBeUndefined()
  })

  it('listJobs skips a corrupt meta file instead of throwing, and still returns the healthy ones', () => {
    writeJobMeta({ id: 'good', region: 'th', status: 'success', startedAt: '2026-07-05T00:00:00.000Z', finishedAt: null, exitCode: 0 })
    const corruptPath = path.join(jobsDir(), 'bad.json')
    fs.mkdirSync(path.dirname(corruptPath), { recursive: true })
    fs.writeFileSync(corruptPath, '{"id": "bad", "stat')
    expect(() => listJobs()).not.toThrow()
    const jobs = listJobs()
    expect(jobs.map(j => j.id)).toEqual(['good'])
  })

  it('writeJobMeta writes atomically via a temp file + rename, never leaving a partial file at the final path', () => {
    const renameSyncSpy = jest.spyOn(fs, 'renameSync')
    const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')

    const meta: JobMeta = {
      id: 'atomic-test',
      region: 'th',
      status: 'running',
      startedAt: '2026-07-05T00:00:00.000Z',
      finishedAt: null,
      exitCode: null
    }
    writeJobMeta(meta)

    const finalPath = path.join(jobsDir(), 'atomic-test.json')

    // The data must be written to a temp path first...
    const writtenPaths = writeFileSyncSpy.mock.calls.map(call => call[0])
    expect(writtenPaths.some(p => typeof p === 'string' && p.includes('atomic-test') && p !== finalPath)).toBe(true)
    // ...then moved into place with a single atomic rename.
    expect(renameSyncSpy).toHaveBeenCalledTimes(1)
    const [renamedFrom, renamedTo] = renameSyncSpy.mock.calls[0]
    expect(renamedTo).toBe(finalPath)
    expect(renamedFrom).not.toBe(renamedTo)

    // And the final file itself is valid, complete JSON.
    expect(getJobMeta('atomic-test')).toEqual(meta)

    renameSyncSpy.mockRestore()
    writeFileSyncSpy.mockRestore()
  })
})
