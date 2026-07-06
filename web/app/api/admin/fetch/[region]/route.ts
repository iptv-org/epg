// web/app/api/admin/fetch/[region]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { startJob } from '@/lib/jobRunner'
import { isAuthorized } from '@/lib/session'

const VALID_REGIONS = ['th', 'no', 'uk', 'sg', 'us']
const REPO_ROOT = path.resolve(process.cwd(), '..')

export async function POST(request: NextRequest, { params }: { params: Promise<{ region: string }> }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { region } = await params
  if (!VALID_REGIONS.includes(region)) {
    return NextResponse.json({ error: 'unknown region' }, { status: 400 })
  }

  const result = startJob({
    region,
    command: 'bash',
    args: [
      'scripts/grab-with-history.sh',
      region,
      `--channels=public/channels-${region}.xml`,
      `--output=public/${region}/guide.xml`
    ],
    cwd: REPO_ROOT
  })

  if (!result.ok) {
    return NextResponse.json({ error: 'region is already running a fetch' }, { status: 409 })
  }

  return NextResponse.json({ job: result.job }, { status: 201 })
}
