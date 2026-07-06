import { NextRequest, NextResponse } from 'next/server'
import { listJobs } from '@/lib/jobStorage'
import { isAuthorized } from '@/lib/session'

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ jobs: listJobs() })
}
