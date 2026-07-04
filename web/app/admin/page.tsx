import Link from 'next/link'
import { requireSession } from '@/lib/session'

export default async function AdminDashboard() {
  await requireSession()

  return (
    <main>
      <h1>EPG Admin</h1>
      <ul>
        <li>
          <Link href="/admin/channels">Manage channels</Link>
        </li>
      </ul>
      <p>
        On-demand fetch, job status, and logs are added in a follow-up
        change — channel changes here take effect the next time the existing
        scheduled fetch runs.
      </p>
    </main>
  )
}
