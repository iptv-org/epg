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
        <li>
          <Link href="/admin/jobs">Fetch jobs &amp; logs</Link>
        </li>
      </ul>
    </main>
  )
}
