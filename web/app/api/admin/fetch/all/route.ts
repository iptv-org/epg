// web/app/api/admin/fetch/all/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { execFileSync } from 'child_process'
import path from 'path'
import { startJobAndWait } from '@/lib/jobRunner'
import { isRegionLocked } from '@/lib/jobLock'
import { isAuthorized } from '@/lib/session'

const REGIONS = ['th', 'no', 'uk', 'sg', 'us']
const REPO_ROOT = path.resolve(process.cwd(), '..')

async function runAllSequentially() {
  for (const region of REGIONS) {
    if (isRegionLocked(region)) continue
    await startJobAndWait({
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
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  execFileSync('node', ['scripts/build-channels.js'], { cwd: REPO_ROOT })

  runAllSequentially().catch(() => {})

  return NextResponse.json({ ok: true, message: 'fetch all started' }, { status: 202 })
}
