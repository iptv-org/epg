import fs from 'fs'
import path from 'path'
import { jobsDir } from '@/lib/paths'

export type JobStatus = 'running' | 'success' | 'failed' | 'interrupted'

export interface JobMeta {
  id: string
  region: string
  status: JobStatus
  startedAt: string
  finishedAt: string | null
  exitCode: number | null
}

function metaPath(id: string): string {
  return path.join(jobsDir(), `${id}.json`)
}

function logPath(id: string): string {
  return path.join(jobsDir(), `${id}.log`)
}

export function writeJobMeta(meta: JobMeta): void {
  fs.mkdirSync(jobsDir(), { recursive: true })
  const finalPath = metaPath(meta.id)
  // Write to a temp file in the same directory and rename into place. Rename
  // is atomic on the same filesystem, so a crash/restart mid-write can never
  // leave a torn/truncated meta file at finalPath for getJobMeta to trip over.
  const tmpPath = `${finalPath}.${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`
  fs.writeFileSync(tmpPath, JSON.stringify(meta, null, 2))
  fs.renameSync(tmpPath, finalPath)
}

export function getJobMeta(id: string): JobMeta | undefined {
  const filePath = metaPath(id)
  if (!fs.existsSync(filePath)) return undefined
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (err) {
    // A corrupt/truncated meta file must not take down listJobs() for every
    // other job. Skip it (treat like a missing job) and log for visibility.
    console.error(`[jobStorage] failed to parse job meta for id "${id}":`, err)
    return undefined
  }
}

export function listJobs(limit = 50): JobMeta[] {
  const dir = jobsDir()
  if (!fs.existsSync(dir)) return []
  const ids = fs
    .readdirSync(dir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace(/\.json$/, ''))
  const jobs = ids
    .map(id => getJobMeta(id))
    .filter((job): job is JobMeta => job !== undefined)
  jobs.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
  return jobs.slice(0, limit)
}

export function appendJobLog(id: string, chunk: string): void {
  fs.mkdirSync(jobsDir(), { recursive: true })
  fs.appendFileSync(logPath(id), chunk)
}

export function getJobLog(id: string): string {
  const filePath = logPath(id)
  if (!fs.existsSync(filePath)) return ''
  return fs.readFileSync(filePath, 'utf8')
}
