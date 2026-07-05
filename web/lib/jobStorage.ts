import fs from 'fs'
import path from 'path'
import { jobsDir } from '@/lib/paths'

export type JobStatus = 'running' | 'success' | 'failed'

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
  fs.writeFileSync(metaPath(meta.id), JSON.stringify(meta, null, 2))
}

export function getJobMeta(id: string): JobMeta | undefined {
  const filePath = metaPath(id)
  if (!fs.existsSync(filePath)) return undefined
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
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
