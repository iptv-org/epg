import { requireSession } from '@/lib/session'
import JobDetailClient from './JobDetailClient'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession()
  const { id } = await params
  return <JobDetailClient id={id} />
}
