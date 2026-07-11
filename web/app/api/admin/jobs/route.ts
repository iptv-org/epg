import { NextRequest, NextResponse } from 'next/server'
import { listJobs } from '@/lib/jobStorage'
import { reconcileJobMeta } from '@/lib/jobRunner'
import { isAuthorized } from '@/lib/session'

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Reconcile each job against this process's live tracking so a job left
  // `running` by a previous process instance (deploy/crash/restart) is
  // reported (and persisted) as `interrupted` instead of forever "running".
  const jobs = listJobs().map(reconcileJobMeta)
  return NextResponse.json({ jobs })
}
