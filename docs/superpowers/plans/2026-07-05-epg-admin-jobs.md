# EPG Admin Jobs (On-Demand Fetch + Status/Logs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add on-demand EPG fetch triggering (per-region and "fetch all") to the already-live `/admin` website, with a job history list and a live-tailing log view, without ever letting a manual fetch collide with the existing pm2 cron jobs.

**Architecture:** A new `web/lib/` trio (`jobStorage.ts`, `jobLock.ts`, `jobRunner.ts`) spawns the exact same `scripts/grab-with-history.sh` command the pm2 cron jobs already use, tracks each run as a small JSON metadata file + a plain-text log file on the existing `/epg/data` volume, and streams new log lines to the browser over Server-Sent Events. `scripts/grab-with-history.sh` gains a per-region `flock`-based lock so a manual fetch and a concurrent cron run for the same region can never corrupt each other's output — one of them cleanly loses the race and exits instead.

**Tech Stack:** Same as the already-deployed admin site (Next.js App Router, TypeScript, Jest). No new npm dependencies — job history is plain JSON/log files on disk, not a database, specifically to avoid the native-dependency/Alpine-build risk that caused today's deployment problems.

## Global Constraints

- No new npm dependencies for job storage — plain JSON metadata files + plain-text log files on `/epg/data`, not SQLite or any native module.
- A per-region lock (via `flock` in `scripts/grab-with-history.sh`) must be shared between the pm2 cron jobs and the website's on-demand spawns — a manual fetch and a scheduled cron run for the same region can never run concurrently.
- The website spawns the *same* `scripts/grab-with-history.sh` command the pm2 cron jobs already use — no duplicated/divergent fetch logic.
- "Fetch all" mirrors `grab-at-startup`'s existing behavior: rebuild channel files once, then run the five regions in sequence (not in parallel).
- Live log view: Server-Sent Events, matching the already-approved design spec.
- Every new API route and page must be gated by `isAuthorized`/`requireSession`, exactly like the existing channels/auth routes.
- `web/lib/paths.ts` already has `locksDir()` (`/epg/data/locks`) from the first deployment, unused until now — this plan is what finally uses it. It also has a now-unused `jobsDbPath()` (SQLite-oriented) that this plan replaces with `jobsDir()`.
- Alpine's busybox may not provide a `flock` that supports locking an already-open file descriptor (the `exec 200>file; flock -n 200` idiom this plan relies on) — install real `util-linux` explicitly rather than assume busybox's applet is sufficient, given today's lesson about unverifiable platform-specific surprises.

---

### Task 1: `lib/paths.ts` — replace `jobsDbPath()` with `jobsDir()`

**Files:**
- Modify: `web/lib/paths.ts`
- Modify: `web/lib/paths.test.ts`

**Interfaces:**
- Produces: `jobsDir(): string` (returns `path.join(dataDir(), 'jobs')`), replacing the removed `jobsDbPath()`.
- Consumes (unchanged): `dataDir()`, `locksDir()` already exist and are reused as-is by later tasks.

- [ ] **Step 1: Update the failing assertion**

In `web/lib/paths.test.ts`, find the block that overrides env vars and asserts on `jobsDbPath()` (from the first deployment), and replace it with an assertion on `jobsDir()`:

```ts
    expect(jobsDir()).toBe(path.join('/tmp/fake-data', 'jobs'))
```

Also update the import line at the top of the file to import `jobsDir` instead of `jobsDbPath`:

```ts
import {
  publicDir,
  dataDir,
  sitesDir,
  channelsSourcesDir,
  channelsXmlPath,
  jobsDir,
  locksDir
} from '@/lib/paths'
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- paths.test.ts`
Expected: FAIL — `jobsDir is not a function` (or a TypeScript error if you run `tsc`), since `lib/paths.ts` still only exports `jobsDbPath`.

- [ ] **Step 3: Update the implementation**

In `web/lib/paths.ts`, replace:

```ts
export function jobsDbPath(): string {
  return path.join(dataDir(), 'jobs.db')
}
```

with:

```ts
export function jobsDir(): string {
  return path.join(dataDir(), 'jobs')
}
```

Leave every other function (`publicDir`, `dataDir`, `sitesDir`, `channelsSourcesDir`, `channelsXmlPath`, `locksDir`) untouched.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- paths.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add web/lib/paths.ts web/lib/paths.test.ts
git commit -m "replace jobsDbPath with jobsDir (job history is plain files, not SQLite)"
```

---

### Task 2: `lib/jobStorage.ts` — job metadata + log file storage

**Files:**
- Create: `web/lib/jobStorage.ts`
- Test: `web/lib/jobStorage.test.ts`

**Interfaces:**
- Consumes: `jobsDir()` from `@/lib/paths`
- Produces:
  - `type JobStatus = 'running' | 'success' | 'failed'`
  - `interface JobMeta { id: string; region: string; status: JobStatus; startedAt: string; finishedAt: string | null; exitCode: number | null }`
  - `writeJobMeta(meta: JobMeta): void`
  - `getJobMeta(id: string): JobMeta | undefined`
  - `listJobs(limit?: number): JobMeta[]` (newest first by `startedAt`, default limit 50)
  - `appendJobLog(id: string, chunk: string): void`
  - `getJobLog(id: string): string`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/jobStorage.test.ts
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  JobMeta,
  writeJobMeta,
  getJobMeta,
  listJobs,
  appendJobLog,
  getJobLog
} from '@/lib/jobStorage'

describe('jobStorage', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epg-jobs-test-'))
    process.env.EPG_DATA_DIR = tmpDir
  })

  afterEach(() => {
    delete process.env.EPG_DATA_DIR
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('getJobMeta returns undefined for a job that does not exist', () => {
    expect(getJobMeta('missing')).toBeUndefined()
  })

  it('writeJobMeta then getJobMeta round-trips', () => {
    const meta: JobMeta = {
      id: '1000-th',
      region: 'th',
      status: 'running',
      startedAt: '2026-07-05T00:00:00.000Z',
      finishedAt: null,
      exitCode: null
    }
    writeJobMeta(meta)
    expect(getJobMeta('1000-th')).toEqual(meta)
  })

  it('listJobs returns an empty array when no jobs exist', () => {
    expect(listJobs()).toEqual([])
  })

  it('listJobs returns jobs newest-first by startedAt', () => {
    writeJobMeta({ id: 'a', region: 'th', status: 'success', startedAt: '2026-07-05T00:00:00.000Z', finishedAt: null, exitCode: 0 })
    writeJobMeta({ id: 'b', region: 'no', status: 'success', startedAt: '2026-07-05T00:05:00.000Z', finishedAt: null, exitCode: 0 })
    const jobs = listJobs()
    expect(jobs.map(j => j.id)).toEqual(['b', 'a'])
  })

  it('listJobs respects the limit', () => {
    writeJobMeta({ id: 'a', region: 'th', status: 'success', startedAt: '2026-07-05T00:00:00.000Z', finishedAt: null, exitCode: 0 })
    writeJobMeta({ id: 'b', region: 'no', status: 'success', startedAt: '2026-07-05T00:05:00.000Z', finishedAt: null, exitCode: 0 })
    expect(listJobs(1)).toHaveLength(1)
  })

  it('getJobLog returns an empty string when no log exists', () => {
    expect(getJobLog('missing')).toBe('')
  })

  it('appendJobLog then getJobLog round-trips and accumulates', () => {
    appendJobLog('1000-th', 'first line\n')
    appendJobLog('1000-th', 'second line\n')
    expect(getJobLog('1000-th')).toBe('first line\nsecond line\n')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- jobStorage.test.ts`
Expected: FAIL — `Cannot find module '@/lib/jobStorage'`

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/jobStorage.ts
import fs from 'fs'
import path from 'path'
import { jobsDir } from '@/lib/paths'

export type JobStatus = 'running' | 'success' | 'failed'

export interface JobMeta {
  id: string
  region: string
  status: JobStatus
  startedAt: string
  finishedAt: string | null
  exitCode: number | null
}

function metaPath(id: string): string {
  return path.join(jobsDir(), `${id}.json`)
}

function logPath(id: string): string {
  return path.join(jobsDir(), `${id}.log`)
}

export function writeJobMeta(meta: JobMeta): void {
  fs.mkdirSync(jobsDir(), { recursive: true })
  fs.writeFileSync(metaPath(meta.id), JSON.stringify(meta, null, 2))
}

export function getJobMeta(id: string): JobMeta | undefined {
  const filePath = metaPath(id)
  if (!fs.existsSync(filePath)) return undefined
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

export function listJobs(limit = 50): JobMeta[] {
  const dir = jobsDir()
  if (!fs.existsSync(dir)) return []
  const ids = fs
    .readdirSync(dir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace(/\.json$/, ''))
  const jobs = ids
    .map(id => getJobMeta(id))
    .filter((job): job is JobMeta => job !== undefined)
  jobs.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
  return jobs.slice(0, limit)
}

export function appendJobLog(id: string, chunk: string): void {
  fs.mkdirSync(jobsDir(), { recursive: true })
  fs.appendFileSync(logPath(id), chunk)
}

export function getJobLog(id: string): string {
  const filePath = logPath(id)
  if (!fs.existsSync(filePath)) return ''
  return fs.readFileSync(filePath, 'utf8')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- jobStorage.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add web/lib/jobStorage.ts web/lib/jobStorage.test.ts
git commit -m "add job metadata/log file storage"
```

---

### Task 3: `lib/jobLock.ts` — in-memory per-region lock

**Files:**
- Create: `web/lib/jobLock.ts`
- Test: `web/lib/jobLock.test.ts`

**Interfaces:**
- Produces:
  - `isRegionLocked(region: string): boolean`
  - `lockRegion(region: string): void`
  - `unlockRegion(region: string): void`

This lock is deliberately only an in-process guard against duplicate manual clicks for the same region within this Node process — it is NOT the mechanism that protects against collisions with the pm2 cron jobs (that's `flock` inside `scripts/grab-with-history.sh`, added in Task 5). Both are needed; neither replaces the other.

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/jobLock.test.ts
import { isRegionLocked, lockRegion, unlockRegion } from '@/lib/jobLock'

describe('jobLock', () => {
  afterEach(() => {
    unlockRegion('th')
  })

  it('is not locked initially', () => {
    expect(isRegionLocked('th')).toBe(false)
  })

  it('lockRegion marks a region as locked', () => {
    lockRegion('th')
    expect(isRegionLocked('th')).toBe(true)
  })

  it('unlockRegion clears the lock', () => {
    lockRegion('th')
    unlockRegion('th')
    expect(isRegionLocked('th')).toBe(false)
  })

  it('locking one region does not affect another', () => {
    lockRegion('th')
    expect(isRegionLocked('no')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- jobLock.test.ts`
Expected: FAIL — `Cannot find module '@/lib/jobLock'`

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/jobLock.ts
const lockedRegions = new Set<string>()

export function isRegionLocked(region: string): boolean {
  return lockedRegions.has(region)
}

export function lockRegion(region: string): void {
  lockedRegions.add(region)
}

export function unlockRegion(region: string): void {
  lockedRegions.delete(region)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- jobLock.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add web/lib/jobLock.ts web/lib/jobLock.test.ts
git commit -m "add in-memory per-region job lock"
```

---

### Task 4: `lib/jobRunner.ts` — spawn orchestration + SSE event glue

**Files:**
- Create: `web/lib/jobRunner.ts`
- Test: `web/lib/jobRunner.test.ts`

**Interfaces:**
- Consumes: `JobMeta`, `JobStatus`, `writeJobMeta`, `appendJobLog` from `@/lib/jobStorage`; `isRegionLocked`, `lockRegion`, `unlockRegion` from `@/lib/jobLock`
- Produces:
  - `interface StartJobOptions { region: string; command: string; args: string[]; cwd: string }`
  - `type StartJobResult = { ok: true; job: JobMeta } | { ok: false; error: 'region_locked' }`
  - `startJob(options: StartJobOptions): StartJobResult` — synchronous return, spawns in the background
  - `startJobAndWait(options: StartJobOptions): Promise<StartJobResult>` — resolves once the spawned process exits
  - `subscribeToJob(id: string, onLine: (line: string) => void, onDone: (meta: JobMeta) => void): () => void` — returns an unsubscribe function

`command`/`args`/`cwd` are parameters, not hardcoded, so tests can pass a fast dummy command (`node -e "..."`) instead of the real grab script.

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/jobRunner.test.ts
import fs from 'fs'
import os from 'os'
import path from 'path'
import { startJob, startJobAndWait, subscribeToJob } from '@/lib/jobRunner'
import { getJobLog } from '@/lib/jobStorage'
import { lockRegion, unlockRegion } from '@/lib/jobLock'

describe('jobRunner', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epg-jobrunner-test-'))
    process.env.EPG_DATA_DIR = tmpDir
  })

  afterEach(() => {
    delete process.env.EPG_DATA_DIR
    fs.rmSync(tmpDir, { recursive: true, force: true })
    unlockRegion('th')
    unlockRegion('no')
  })

  it('startJob rejects when the region is already locked', () => {
    lockRegion('th')
    const result = startJob({ region: 'th', command: 'node', args: ['-e', ''], cwd: tmpDir })
    expect(result).toEqual({ ok: false, error: 'region_locked' })
  })

  it('a successful job records status success, exit code 0, and captures stdout', async () => {
    const result = await startJobAndWait({
      region: 'th',
      command: 'node',
      args: ['-e', 'console.log("hello from job")'],
      cwd: tmpDir
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.job.status).toBe('success')
    expect(result.job.exitCode).toBe(0)
    expect(result.job.finishedAt).not.toBeNull()
    expect(getJobLog(result.job.id)).toContain('hello from job')
  })

  it('a failing job records status failed and a non-zero exit code', async () => {
    const result = await startJobAndWait({
      region: 'no',
      command: 'node',
      args: ['-e', 'process.exit(1)'],
      cwd: tmpDir
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.job.status).toBe('failed')
    expect(result.job.exitCode).toBe(1)
  })

  it('subscribeToJob receives live log lines and a done callback', async () => {
    const lines: string[] = []
    let doneStatus: string | null = null

    const startResult = startJob({
      region: 'th',
      command: 'node',
      args: ['-e', 'console.log("live line"); process.exit(0)'],
      cwd: tmpDir
    })
    expect(startResult.ok).toBe(true)
    if (!startResult.ok) return

    await new Promise<void>(resolve => {
      const unsubscribe = subscribeToJob(
        startResult.job.id,
        line => lines.push(line),
        meta => {
          doneStatus = meta.status
          unsubscribe()
          resolve()
        }
      )
    })

    expect(lines.join('')).toContain('live line')
    expect(doneStatus).toBe('success')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- jobRunner.test.ts`
Expected: FAIL — `Cannot find module '@/lib/jobRunner'`

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/jobRunner.ts
import { spawn } from 'child_process'
import { EventEmitter } from 'events'
import { JobMeta, JobStatus, writeJobMeta, appendJobLog } from '@/lib/jobStorage'
import { isRegionLocked, lockRegion, unlockRegion } from '@/lib/jobLock'

const jobEvents = new EventEmitter()
jobEvents.setMaxListeners(0)

export interface StartJobOptions {
  region: string
  command: string
  args: string[]
  cwd: string
}

export type StartJobResult = { ok: true; job: JobMeta } | { ok: false; error: 'region_locked' }

export function startJob(options: StartJobOptions): StartJobResult {
  const { region, command, args, cwd } = options
  if (isRegionLocked(region)) {
    return { ok: false, error: 'region_locked' }
  }
  lockRegion(region)

  const id = `${Date.now()}-${region}`
  const meta: JobMeta = {
    id,
    region,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exitCode: null
  }
  writeJobMeta(meta)

  const child = spawn(command, args, { cwd })

  child.stdout.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    appendJobLog(id, text)
    jobEvents.emit('line', id, text)
  })
  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    appendJobLog(id, text)
    jobEvents.emit('line', id, text)
  })

  child.on('exit', (code: number | null) => {
    unlockRegion(region)
    const status: JobStatus = code === 0 ? 'success' : 'failed'
    const finished: JobMeta = {
      ...meta,
      status,
      finishedAt: new Date().toISOString(),
      exitCode: code
    }
    writeJobMeta(finished)
    jobEvents.emit('done', id, finished)
  })

  return { ok: true, job: meta }
}

export function startJobAndWait(options: StartJobOptions): Promise<StartJobResult> {
  const result = startJob(options)
  if (!result.ok) return Promise.resolve(result)
  return new Promise(resolve => {
    const onDone = (id: string, finalMeta: JobMeta) => {
      if (id !== result.job.id) return
      jobEvents.off('done', onDone)
      resolve({ ok: true, job: finalMeta })
    }
    jobEvents.on('done', onDone)
  })
}

export function subscribeToJob(
  id: string,
  onLine: (line: string) => void,
  onDone: (meta: JobMeta) => void
): () => void {
  const lineHandler = (jobId: string, line: string) => {
    if (jobId === id) onLine(line)
  }
  const doneHandler = (jobId: string, meta: JobMeta) => {
    if (jobId === id) onDone(meta)
  }
  jobEvents.on('line', lineHandler)
  jobEvents.on('done', doneHandler)
  return () => {
    jobEvents.off('line', lineHandler)
    jobEvents.off('done', doneHandler)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- jobRunner.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add web/lib/jobRunner.ts web/lib/jobRunner.test.ts
git commit -m "add job spawn orchestration and SSE event glue"
```

---

### Task 5: Region lock in `grab-with-history.sh` + `pm2.config.js` + `Dockerfile`

**Files:**
- Modify: `scripts/grab-with-history.sh`
- Modify: `pm2.config.js`
- Modify: `Dockerfile`

**Interfaces:**
- Produces: `scripts/grab-with-history.sh <region> [...grab args]` — a new required first positional argument, region, used only for the lock file name (not passed through to `npm run grab`). Every existing caller (pm2 cron jobs, and the API routes built in Tasks 6-7) must supply it.

This task has no automated tests (it's a shell script + infra config change; `flock` can't be meaningfully tested on Windows). It's verified by reading the script carefully and by the deployment checklist in Task 14.

- [ ] **Step 1: Modify `scripts/grab-with-history.sh`**

Full resulting file:

```bash
#!/bin/bash
set -e
export CURR_DATE=$(date -d "yesterday" +%Y-%m-%dT00:00:00.000Z)

REGION="$1"
shift

DATA_DIR="${EPG_DATA_DIR:-/epg/data}"
LOCK_DIR="$DATA_DIR/locks"
mkdir -p "$LOCK_DIR"
LOCK_FILE="$LOCK_DIR/$REGION.lock"

exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  echo "region '$REGION' is already locked by another grab, aborting" >&2
  exit 1
fi

npm run grab -- "$@" --days=6
```

- [ ] **Step 2: Modify `pm2.config.js`**

Change `grabAll`, `buildAndGrabAll`, the legacy `grab` app, and the per-region `grab-*` apps to pass a region name as the new first argument to `grab-with-history.sh`. Full resulting file:

```js
const CRON = process.env.CRON_SCHEDULE || '0 4 * * *'

const grabAll = process.env.SITES
  ? `bash scripts/grab-with-history.sh legacy --sites=${process.env.SITES} ${
      process.env.CLANG ? `--lang=${process.env.CLANG}` : ''
    } --output=public/guide.xml`
  : 'bash scripts/grab-with-history.sh legacy --channels=public/channels.xml --output=public/guide.xml'

const regions = [
  { name: 'th',  channels: 'channels-th.xml',  output: 'th/guide.xml' },
  { name: 'no',  channels: 'channels-no.xml',  output: 'no/guide.xml' },
  { name: 'uk',  channels: 'channels-uk.xml',  output: 'uk/guide.xml' },
  { name: 'sg',  channels: 'channels-sg.xml',  output: 'sg/guide.xml' },
  { name: 'us',  channels: 'channels-us.xml',  output: 'us/guide.xml'  }
]

// Builds all regional channel files then runs every regional grab in sequence.
// Used as the single startup job so channel files are guaranteed to exist
// before any grab starts.
const buildAndGrabAll = [
  'node scripts/build-channels.js',
  ...regions.map(({ name, channels, output }) =>
    `bash scripts/grab-with-history.sh ${name} --channels=public/${channels} --output=public/${output}`
  ),
  grabAll
].join(' && ')

const apps = [
  {
    name: 'serve',
    script: 'npx serve public -l 3002',
    instances: 1,
    watch: false,
    autorestart: true
  },
  {
    name: 'caddy',
    script: 'caddy',
    args: 'run --config Caddyfile --adapter caddyfile',
    instances: 1,
    watch: false,
    autorestart: true
  },
  {
    name: 'web',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3001',
    cwd: './web',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    autorestart: true
  },
  // Legacy combined grab (keeps public/guide.xml up to date for existing integrations)
  {
    name: 'grab',
    script: `npx chronos -e "${grabAll}" -p "${CRON}" -l`,
    instances: 1,
    watch: false,
    autorestart: true
  },
  // Per-region scheduled grabs
  ...regions.map(({ name, channels, output }) => ({
    name: `grab-${name}`,
    script: `npx chronos -e "bash scripts/grab-with-history.sh ${name} --channels=public/${channels} --output=public/${output}" -p "${CRON}" -l`,
    instances: 1,
    watch: false,
    autorestart: true
  }))
]

if (process.env.RUN_AT_STARTUP === 'true') {
  apps.push({
    name: 'grab-at-startup',
    script: 'bash',
    args: ['-c', buildAndGrabAll],
    instances: 1,
    autorestart: false,
    watch: false,
    max_restarts: 1
  })
}

module.exports = { apps }
```

- [ ] **Step 3: Modify `Dockerfile`**

Add `util-linux` to the `apk add` line, guaranteeing a real `flock` that supports locking an already-open file descriptor (the `exec 200>file; flock -n 200` idiom `grab-with-history.sh` now relies on) — do not depend on whatever `flock` applet busybox happens to ship. Full resulting file:

```dockerfile
FROM node:22-alpine
ARG WORKDIR=/epg
ENV CRON_SCHEDULE="0 0 * * *"
ENV RUN_AT_STARTUP=true
RUN apk update \
    && apk upgrade --available \
    && apk add curl tzdata bash caddy util-linux \
    && npm install pm2 -g \
    && mkdir /public
WORKDIR $WORKDIR
COPY . .
RUN npm install \
    && cd web \
    && npm install \
    && npm run build
VOLUME ["/epg/public", "/epg/data"]
EXPOSE 3000
CMD [ "pm2-runtime", "pm2.config.js" ]
```

- [ ] **Step 4: Sanity-check `pm2.config.js` still loads**

Run: `node -e "const {apps} = require('./pm2.config.js'); console.log(apps.map(a => a.name))"`
Expected: prints all 9 app names (`serve, caddy, web, grab, grab-th, grab-no, grab-uk, grab-sg, grab-us`), no errors.

- [ ] **Step 5: Commit**

```bash
git add scripts/grab-with-history.sh pm2.config.js Dockerfile
git commit -m "add per-region flock lock shared between cron grabs and manual fetches"
```

---

### Task 6: Fetch API route (single region)

**Files:**
- Create: `web/app/api/admin/fetch/[region]/route.ts`

**Interfaces:**
- Consumes: `startJob` from `@/lib/jobRunner`; `isAuthorized` from `@/lib/session`
- Produces: `POST /api/admin/fetch/:region`

- [ ] **Step 1: Create the route**

```ts
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
```

- [ ] **Step 2: Manually verify**

Start the dev server (inline env vars, matching earlier tasks: `ADMIN_PASSWORD_HASH`/`SESSION_SECRET`, password `test-password-123`). Log in for a cookie jar, then:

```bash
curl -b /tmp/epg-cookies.txt -i -X POST http://localhost:3001/api/admin/fetch/th
```

Expected: `HTTP/1.1 201` with a `{"job":{"id":"...","region":"th","status":"running",...}}` body. Immediately repeating the same request:

```bash
curl -b /tmp/epg-cookies.txt -i -X POST http://localhost:3001/api/admin/fetch/th
```

Expected: `HTTP/1.1 409` with `{"error":"region is already running a fetch"}`, since the region lock is still held (the actual `grab-with-history.sh` will likely fail quickly in this local dev environment without the full repo's grab dependencies set up — that's fine for this check, we're only verifying the lock/route wiring, not a full successful grab).

- [ ] **Step 3: Commit**

```bash
git add web/app/api/admin/fetch
git commit -m "add single-region fetch API route"
```

---

### Task 7: Fetch API route (all regions)

**Files:**
- Create: `web/app/api/admin/fetch/all/route.ts`

**Interfaces:**
- Consumes: `startJobAndWait` from `@/lib/jobRunner`; `isRegionLocked` from `@/lib/jobLock`; `isAuthorized` from `@/lib/session`
- Produces: `POST /api/admin/fetch/all`

- [ ] **Step 1: Create the route**

```ts
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
```

`runAllSequentially` is intentionally not awaited by the route handler — an HTTP request can't stay open for the several minutes five sequential regional fetches could take. The route returns immediately once the (fast) channel-file rebuild is done; the jobs list (Task 10) is how the admin observes progress.

- [ ] **Step 2: Manually verify**

With the dev server running and logged in:

```bash
curl -b /tmp/epg-cookies.txt -i -X POST http://localhost:3001/api/admin/fetch/all
```

Expected: `HTTP/1.1 202` with `{"ok":true,"message":"fetch all started"}`, returned quickly (not blocking for minutes).

- [ ] **Step 3: Commit**

```bash
git add web/app/api/admin/fetch/all
git commit -m "add fetch-all API route"
```

---

### Task 8: Jobs list API route

**Files:**
- Create: `web/app/api/admin/jobs/route.ts`

**Interfaces:**
- Consumes: `listJobs` from `@/lib/jobStorage`; `isAuthorized` from `@/lib/session`
- Produces: `GET /api/admin/jobs`

- [ ] **Step 1: Create the route**

```ts
// web/app/api/admin/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { listJobs } from '@/lib/jobStorage'
import { isAuthorized } from '@/lib/session'

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ jobs: listJobs() })
}
```

- [ ] **Step 2: Manually verify**

```bash
curl -b /tmp/epg-cookies.txt -s http://localhost:3001/api/admin/jobs
```

Expected: `{"jobs":[...]}` including the jobs started in Tasks 6-7's manual verification, newest first.

- [ ] **Step 3: Commit**

```bash
git add web/app/api/admin/jobs/route.ts
git commit -m "add jobs list API route"
```

---

### Task 9: Job detail + SSE log stream API routes

**Files:**
- Create: `web/app/api/admin/jobs/[id]/route.ts`
- Create: `web/app/api/admin/jobs/[id]/stream/route.ts`

**Interfaces:**
- Consumes: `getJobMeta`, `getJobLog` from `@/lib/jobStorage`; `subscribeToJob` from `@/lib/jobRunner`; `isAuthorized` from `@/lib/session`
- Produces: `GET /api/admin/jobs/:id`, `GET /api/admin/jobs/:id/stream`

- [ ] **Step 1: Create the job detail route**

```ts
// web/app/api/admin/jobs/[id]/route.ts
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
```

- [ ] **Step 2: Create the SSE stream route**

```ts
// web/app/api/admin/jobs/[id]/stream/route.ts
import { NextRequest } from 'next/server'
import { getJobMeta, getJobLog } from '@/lib/jobStorage'
import { subscribeToJob } from '@/lib/jobRunner'
import { isAuthorized } from '@/lib/session'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) {
    return new Response('unauthorized', { status: 401 })
  }

  const { id } = await params
  const job = getJobMeta(id)
  if (!job) {
    return new Response('not found', { status: 404 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: getJobLog(id) })}\n\n`))

      if (job.status !== 'running') {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, status: job.status })}\n\n`))
        controller.close()
        return
      }

      const unsubscribe = subscribeToJob(
        id,
        line => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ line })}\n\n`))
        },
        meta => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, status: meta.status })}\n\n`))
          controller.close()
          unsubscribe()
        }
      )

      request.signal.addEventListener('abort', () => {
        unsubscribe()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}
```

- [ ] **Step 3: Manually verify**

```bash
curl -b /tmp/epg-cookies.txt -s http://localhost:3001/api/admin/jobs/<id-from-task-6>
```

Expected: `{"job":{...},"log":"..."}`.

```bash
curl -b /tmp/epg-cookies.txt -N http://localhost:3001/api/admin/jobs/<id-from-task-6>/stream
```

Expected: at least one `data: {...}` line printed immediately (the existing log), and — since the earlier manual-verification job has almost certainly already finished — a `data: {"done":true,...}` line right after, then the connection closes. `-N` disables curl's output buffering so you see lines as they arrive.

- [ ] **Step 4: Commit**

```bash
git add web/app/api/admin/jobs/[id]
git commit -m "add job detail and SSE log stream API routes"
```

---

### Task 10: Jobs list UI page

**Files:**
- Create: `web/app/admin/jobs/page.tsx`
- Create: `web/app/admin/jobs/JobsClient.tsx`

**Interfaces:**
- Consumes: `requireSession` from `@/lib/session`; `GET /api/admin/jobs`, `POST /api/admin/fetch/:region`, `POST /api/admin/fetch/all`

- [ ] **Step 1: Create the server component wrapper**

```tsx
// web/app/admin/jobs/page.tsx
import { requireSession } from '@/lib/session'
import JobsClient from './JobsClient'

export default async function JobsPage() {
  await requireSession()
  return <JobsClient />
}
```

- [ ] **Step 2: Create the client component**

```tsx
// web/app/admin/jobs/JobsClient.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface JobMeta {
  id: string
  region: string
  status: 'running' | 'success' | 'failed'
  startedAt: string
  finishedAt: string | null
  exitCode: number | null
}

const REGIONS = ['th', 'no', 'uk', 'sg', 'us']

export default function JobsClient() {
  const [jobs, setJobs] = useState<JobMeta[]>([])
  const [message, setMessage] = useState<string | null>(null)

  async function loadJobs() {
    const response = await fetch('/api/admin/jobs')
    if (!response.ok) {
      setMessage('Error: failed to load jobs')
      return
    }
    const data = await response.json()
    setJobs(data.jobs || [])
  }

  useEffect(() => {
    loadJobs()
    const interval = setInterval(loadJobs, 5000)
    return () => clearInterval(interval)
  }, [])

  async function startFetch(region: string) {
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/fetch/${region}`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        setMessage(`Error: ${data.error}`)
        return
      }
      setMessage(`Started fetch for ${region}`)
      await loadJobs()
    } catch (err) {
      setMessage('Error: failed to start fetch')
    }
  }

  async function startFetchAll() {
    setMessage(null)
    try {
      const response = await fetch('/api/admin/fetch/all', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        setMessage(`Error: ${data.error}`)
        return
      }
      setMessage('Fetch all started')
      await loadJobs()
    } catch (err) {
      setMessage('Error: failed to start fetch all')
    }
  }

  return (
    <main>
      <h1>Jobs</h1>
      {message && <p>{message}</p>}

      <section>
        <h2>Start a fetch</h2>
        {REGIONS.map(region => (
          <button key={region} onClick={() => startFetch(region)}>
            Fetch {region}
          </button>
        ))}
        <button onClick={startFetchAll}>Fetch all</button>
      </section>

      <section>
        <h2>History</h2>
        <table>
          <thead>
            <tr>
              <th>Region</th>
              <th>Status</th>
              <th>Started</th>
              <th>Finished</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
                <td>{job.region}</td>
                <td>{job.status}</td>
                <td>{new Date(job.startedAt).toLocaleString()}</td>
                <td>{job.finishedAt ? new Date(job.finishedAt).toLocaleString() : '—'}</td>
                <td>
                  <Link href={`/admin/jobs/${job.id}`}>View log</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Manually verify in a browser**

With the dev server running, log in, visit `http://localhost:3001/admin/jobs`. Click a region's "Fetch" button, confirm a new row appears in "History" within 5 seconds (the polling interval), and that "View log" links to `/admin/jobs/<id>`.

- [ ] **Step 4: Commit**

```bash
git add web/app/admin/jobs/page.tsx web/app/admin/jobs/JobsClient.tsx
git commit -m "add jobs list UI page"
```

---

### Task 11: Job detail UI page with live SSE tailing

**Files:**
- Create: `web/app/admin/jobs/[id]/page.tsx`
- Create: `web/app/admin/jobs/[id]/JobDetailClient.tsx`

**Interfaces:**
- Consumes: `requireSession` from `@/lib/session`; `GET /api/admin/jobs/:id`, `GET /api/admin/jobs/:id/stream` (browser-native `EventSource`)

- [ ] **Step 1: Create the server component wrapper**

```tsx
// web/app/admin/jobs/[id]/page.tsx
import { requireSession } from '@/lib/session'
import JobDetailClient from './JobDetailClient'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession()
  const { id } = await params
  return <JobDetailClient id={id} />
}
```

- [ ] **Step 2: Create the client component**

```tsx
// web/app/admin/jobs/[id]/JobDetailClient.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface JobMeta {
  id: string
  region: string
  status: 'running' | 'success' | 'failed'
  startedAt: string
  finishedAt: string | null
  exitCode: number | null
}

export default function JobDetailClient({ id }: { id: string }) {
  const [job, setJob] = useState<JobMeta | null>(null)
  const [log, setLog] = useState('')
  const [error, setError] = useState<string | null>(null)
  const logRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    let eventSource: EventSource | null = null

    async function load() {
      const response = await fetch(`/api/admin/jobs/${id}`)
      if (!response.ok) {
        setError('Error: job not found')
        return
      }
      const data = await response.json()
      setJob(data.job)
      setLog(data.log)

      if (data.job.status === 'running') {
        eventSource = new EventSource(`/api/admin/jobs/${id}/stream`)
        eventSource.onmessage = event => {
          const payload = JSON.parse(event.data)
          if (payload.line) {
            setLog(prev => prev + payload.line)
          }
          if (payload.done) {
            setJob(prev => (prev ? { ...prev, status: payload.status } : prev))
            eventSource?.close()
          }
        }
      }
    }

    load()

    return () => {
      eventSource?.close()
    }
  }, [id])

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight)
  }, [log])

  if (error) {
    return (
      <main>
        <p>{error}</p>
      </main>
    )
  }
  if (!job) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    )
  }

  return (
    <main>
      <h1>
        Job {job.region} — {job.status}
      </h1>
      <p>Started: {new Date(job.startedAt).toLocaleString()}</p>
      {job.finishedAt && <p>Finished: {new Date(job.finishedAt).toLocaleString()}</p>}
      {job.exitCode !== null && <p>Exit code: {job.exitCode}</p>}
      <pre
        ref={logRef}
        style={{ maxHeight: '500px', overflow: 'auto', background: '#111', color: '#eee', padding: '1rem' }}
      >
        {log}
      </pre>
    </main>
  )
}
```

- [ ] **Step 3: Manually verify in a browser**

Start a fetch from `/admin/jobs`, then click "View log" while it's still running. Confirm the log panel updates live without a page refresh, and that the heading's status updates to `success`/`failed` and the SSE connection closes once the job finishes (check the Network tab: the `stream` request should show as complete, not still pending).

- [ ] **Step 4: Commit**

```bash
git add web/app/admin/jobs/[id]/page.tsx "web/app/admin/jobs/[id]/JobDetailClient.tsx"
git commit -m "add job detail UI page with live SSE log tailing"
```

---

### Task 12: Dashboard update — link to jobs, drop the "follow-up" note

**Files:**
- Modify: `web/app/admin/page.tsx`

**Interfaces:**
- Consumes: `requireSession` from `@/lib/session` (unchanged)

- [ ] **Step 1: Update the dashboard page**

Replace the entire file with:

```tsx
// web/app/admin/page.tsx
import Link from 'next/link'
import { requireSession } from '@/lib/session'

export default async function AdminDashboard() {
  await requireSession()

  return (
    <main>
      <h1>EPG Admin</h1>
      <ul>
        <li>
          <Link href="/admin/channels">Manage channels</Link>
        </li>
        <li>
          <Link href="/admin/jobs">Fetch jobs &amp; logs</Link>
        </li>
      </ul>
    </main>
  )
}
```

This removes the old "On-demand fetch, job status, and logs are added in a follow-up change" note from the first deployment, since that follow-up is what this plan delivers.

- [ ] **Step 2: Manually verify**

Visit `/admin` while logged in — confirm both links are present and "Fetch jobs & logs" goes to `/admin/jobs`.

- [ ] **Step 3: Commit**

```bash
git add web/app/admin/page.tsx
git commit -m "link the dashboard to the new jobs page"
```

---

### Task 13: README update for fetch/jobs

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the "Admin website" section**

Find the paragraph in `README.md`'s "Admin website" section that says:

```
Currently supported: adding and removing channels (via catalog search or
manual entry). On-demand fetch triggering and job status/logs are planned as
a follow-up and aren't available yet.
```

Replace it with:

```
Supported: adding and removing channels (via catalog search or manual
entry), triggering an on-demand fetch per region or for all regions at
once, and viewing job history with a live-updating log for in-progress
fetches.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "update README: fetch triggering and job logs are now live"
```

---

### Task 14: Pre-deploy verification checklist

**Files:** none (verification only)

Given today's deployment took six real, non-obvious production bugs to resolve (a CRLF lint rule, a stray `--` flag, a PM2 `npm`-as-script quirk, a stale Docker build cache, a PM2 cluster-mode misfire, and a missing Caddy route), and Docker still isn't available on this machine, treat every item below as a real risk, not a formality — verify each one after deploying, before considering this feature done.

- [ ] **Step 1: Confirm `flock` actually works on the deployed container**

The one piece of this plan that's structurally impossible to verify locally is whether `exec 200>"$LOCK_FILE"; flock -n 200` behaves correctly with the `util-linux` package on Alpine. After deploying, trigger a fetch for a region from `/admin/jobs`, and — while it's still running — immediately trigger the *same* region again. Expected: the second attempt returns `409` (from Task 6's route) and the first job's log should show the real grab running normally (not both racing). If `flock` behaves unexpectedly, the region's grab could run twice concurrently and corrupt its output file — check the region's `guide.xml` for garbled/truncated content if anything looks off.

- [ ] **Step 2: Confirm cron and manual fetches actually share the lock**

Wait for (or manually adjust `CRON_SCHEDULE` briefly to trigger sooner) a scheduled cron grab for some region, and simultaneously trigger a manual fetch for that same region from `/admin/jobs`. Expected: one of the two logs a message like `region 'th' is already locked by another grab, aborting` and exits without corrupting the other's output.

- [ ] **Step 3: Confirm SSE streaming survives the full Caddy → Cloudflare path**

Start a fetch from `/admin/jobs` and open its detail page immediately (while it's running). Confirm log lines appear progressively in the browser rather than all arriving at once when the job finishes — this proves Caddy and Cloudflare aren't buffering the whole response before delivering it.

- [ ] **Step 4: Confirm "fetch all" really runs sequentially, not in parallel**

Trigger "Fetch all" from `/admin/jobs` and watch the jobs list. Expected: one region's job is `running` at a time, with the others appearing as `running` only after the previous one reaches `success`/`failed` — never more than one `running` row for the five regions simultaneously.

- [ ] **Step 5: Confirm `/admin/jobs` and `/admin/jobs/:id` are reachable in production**

Same class of bug as today's `/_next/*` 404s is possible here too if any new path prefix were introduced — it isn't in this plan (`/admin/jobs*` is still under the existing `/admin*` Caddy route), but double check by visiting both pages fresh (new incognito window) and confirming no 404s in the Network tab for any request.
