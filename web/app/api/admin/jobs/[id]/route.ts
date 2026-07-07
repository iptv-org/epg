import { NextRequest, NextResponse } from 'next/server'
import { getJobMeta, getJobLog } from '@/lib/jobStorage'
import { isAuthorized } from '@/lib/session'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const job = getJobMeta(id)
  if (!job) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  return NextResponse.json({ job, log: getJobLog(id) })
}
