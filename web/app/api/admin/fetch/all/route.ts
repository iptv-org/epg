// web/app/api/admin/fetch/all/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { execFileSync } from 'child_process'
import path from 'path'
import { startJobAndWait } from '@/lib/jobRunner'
import { isRegionLocked, isFetchAllRunning, lockFetchAll, unlockFetchAll } from '@/lib/jobLock'
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

  // Fail fast if a "fetch all" run is already in flight. Without this, a
  // second concurrent POST would start its own runAllSequentially() loop,
  // which (since per-region locks are only checked/set synchronously inside
  // each iteration, with an `await` yielding control between regions) can
  // interleave with the first loop and run two *different* regions in
  // parallel — defeating the sequential guarantee this endpoint exists to
  // provide. This check-and-set is synchronous, so there is no window for a
  // second request to race between the check and the lock.
  if (isFetchAllRunning()) {
    return NextResponse.json({ error: 'fetch all is already running' }, { status: 409 })
  }
  lockFetchAll()

  try {
    execFileSync('node', ['scripts/build-channels.js'], { cwd: REPO_ROOT })
  } catch (err) {
    unlockFetchAll()
    throw err
  }

  runAllSequentially()
    .catch(err => {
      console.error('fetch all: sequential run failed', err)
    })
    .finally(() => {
      unlockFetchAll()
    })

  return NextResponse.json({ ok: true, message: 'fetch all started' }, { status: 202 })
}
