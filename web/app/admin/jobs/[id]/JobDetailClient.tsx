'use client'

import { useEffect, useRef, useState } from 'react'

interface JobMeta {
  id: string
  region: string
  status: 'running' | 'success' | 'failed'
  startedAt: string
  finishedAt: string | null
  exitCode: number | null
}

export default function JobDetailClient({ id }: { id: string }) {
  const [job, setJob] = useState<JobMeta | null>(null)
  const [log, setLog] = useState('')
  const [error, setError] = useState<string | null>(null)
  const logRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    let eventSource: EventSource | null = null

    async function load() {
      const response = await fetch(`/api/admin/jobs/${id}`)
      if (!response.ok) {
        setError('Error: job not found')
        return
      }
      const data = await response.json()
      setJob(data.job)
      setLog(data.log)

      if (data.job.status === 'running') {
        eventSource = new EventSource(`/api/admin/jobs/${id}/stream`)
        eventSource.onmessage = event => {
          const payload = JSON.parse(event.data)
          if (payload.line) {
            setLog(prev => prev + payload.line)
          }
          if (payload.done) {
            setJob(prev => (prev ? { ...prev, status: payload.status } : prev))
            eventSource?.close()
          }
        }
      }
    }

    load()

    return () => {
      eventSource?.close()
    }
  }, [id])

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight)
  }, [log])

  if (error) {
    return (
      <main>
        <p>{error}</p>
      </main>
    )
  }
  if (!job) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    )
  }

  return (
    <main>
      <h1>
        Job {job.region} — {job.status}
      </h1>
      <p>Started: {new Date(job.startedAt).toLocaleString()}</p>
      {job.finishedAt && <p>Finished: {new Date(job.finishedAt).toLocaleString()}</p>}
      {job.exitCode !== null && <p>Exit code: {job.exitCode}</p>}
      <pre
        ref={logRef}
        style={{ maxHeight: '500px', overflow: 'auto', background: '#111', color: '#eee', padding: '1rem' }}
      >
        {log}
      </pre>
    </main>
  )
}
