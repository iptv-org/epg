// web/app/admin/jobs/page.tsx
import { requireSession } from '@/lib/session'
import JobsClient from './JobsClient'

export default async function JobsPage() {
  await requireSession()
  return <JobsClient />
}
