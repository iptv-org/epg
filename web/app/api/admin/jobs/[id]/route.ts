import { NextRequest, NextResponse } from 'next/server'
import { getJobMeta, getJobLog } from '@/lib/jobStorage'
import { reconcileJobMeta } from '@/lib/jobRunner'
import { isAuthorized } from '@/lib/session'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const rawJob = getJobMeta(id)
  if (!rawJob) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  // See jobRunner.reconcileJobMeta: a job left `running` by a previous
  // process instance is reported as `interrupted` instead of forever "running".
  const job = reconcileJobMeta(rawJob)
  return NextResponse.json({ job, log: getJobLog(id) })
}
