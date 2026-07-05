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
})
