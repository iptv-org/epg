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
    let cancelled = false
    let eventSource: EventSource | null = null

    async function load() {
      const response = await fetch(`/api/admin/jobs/${id}`)
      if (cancelled) return
      if (!response.ok) {
        setError('Error: job not found')
        return
      }
      const data = await response.json()
      if (cancelled) return
      setJob(data.job)
      setLog(data.log)

      if (data.job.status === 'running') {
        const source = new EventSource(`/api/admin/jobs/${id}/stream`)
        if (cancelled) {
          // Cleanup already ran before this async fetch resolved; don't
          // leave a dangling connection open on a torn-down effect.
          source.close()
          return
        }
        eventSource = source
        source.onmessage = event => {
          const payload = JSON.parse(event.data)
          if (typeof payload.log === 'string') {
            // Full resync of the log as of connection time (covers the gap
            // between the initial fetch and the SSE connection opening).
            setLog(payload.log)
          }
          if (payload.line) {
            setLog(prev => prev + payload.line)
          }
          if (payload.done) {
            setJob(prev => (prev ? { ...prev, status: payload.status } : prev))
            source.close()
          }
        }
      }
    }

    load()

    return () => {
      cancelled = true
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
