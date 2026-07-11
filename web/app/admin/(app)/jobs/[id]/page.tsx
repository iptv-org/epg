// web/app/admin/(app)/jobs/[id]/page.tsx
import JobDetailClient from './JobDetailClient'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <JobDetailClient id={id} />
}
