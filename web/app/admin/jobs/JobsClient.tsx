'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface JobMeta {
  id: string
  region: string
  status: 'running' | 'success' | 'failed' | 'interrupted'
  startedAt: string
  finishedAt: string | null
  exitCode: number | null
}

const REGIONS = ['th', 'no', 'uk', 'sg', 'us']

export default function JobsClient() {
  const [jobs, setJobs] = useState<JobMeta[]>([])
  const [message, setMessage] = useState<string | null>(null)

  async function loadJobs() {
    const response = await fetch('/api/admin/jobs')
    if (!response.ok) {
      setMessage('Error: failed to load jobs')
      return
    }
    const data = await response.json()
    setJobs(data.jobs || [])
  }

  useEffect(() => {
    loadJobs()
    const interval = setInterval(loadJobs, 5000)
    return () => clearInterval(interval)
  }, [])

  async function startFetch(region: string) {
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/fetch/${region}`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        setMessage(`Error: ${data.error}`)
        return
      }
      setMessage(`Started fetch for ${region}`)
      await loadJobs()
    } catch (err) {
      setMessage('Error: failed to start fetch')
    }
  }

  async function startFetchAll() {
    setMessage(null)
    try {
      const response = await fetch('/api/admin/fetch/all', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        setMessage(`Error: ${data.error}`)
        return
      }
      setMessage('Fetch all started')
      await loadJobs()
    } catch (err) {
      setMessage('Error: failed to start fetch all')
    }
  }

  return (
    <main>
      <h1>Jobs</h1>
      {message && <p>{message}</p>}

      <section>
        <h2>Start a fetch</h2>
        {REGIONS.map(region => (
          <button key={region} onClick={() => startFetch(region)}>
            Fetch {region}
          </button>
        ))}
        <button onClick={startFetchAll}>Fetch all</button>
      </section>

      <section>
        <h2>History</h2>
        <table>
          <thead>
            <tr>
              <th>Region</th>
              <th>Status</th>
              <th>Started</th>
              <th>Finished</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
                <td>{job.region}</td>
                <td>{job.status}</td>
                <td>{new Date(job.startedAt).toLocaleString()}</td>
                <td>{job.finishedAt ? new Date(job.finishedAt).toLocaleString() : '—'}</td>
                <td>
                  <Link href={`/admin/jobs/${job.id}`}>View log</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
