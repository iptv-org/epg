# EPG Admin Foundation (Auth + Channel Management) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a password-protected `/admin` website to the `dj1p/epg` repo that lets an operator add/remove channels (via catalog search or manual entry) from `public/channels.xml`, without touching any existing EPG XML URLs.

**Architecture:** A new `web/` Next.js (App Router, TypeScript) app runs as an additional pm2 process alongside the existing `serve`/grab jobs. Caddy is added as the container's single exposed process, routing `/admin*` and `/api/admin/*` to Next.js and everything else to the existing static file server. Two new Coolify volumes make `public/` (all served files, including the `channels.xml` master list) and a new small `data/` directory (reserved for Plan 2's job history) durable across redeploys — today neither exists on disk until the container's startup job regenerates it.

**Tech Stack:** Next.js 15 (App Router) + TypeScript, `@node-rs/argon2` for password hashing (prebuilt binaries, no native build toolchain needed on Alpine), Node's built-in `crypto` for session signing, Jest + `@swc/jest` for unit tests (matching the root repo's existing test setup), Caddy for reverse proxying.

## Global Constraints

- Existing EPG XML URLs (`/guide.xml`, `/th/guide.xml`, `/channels-th.xml`, etc.) must keep working exactly as today — no path changes, no downtime gap across a deploy.
- Node engine floor: `>=20.20.0` (matches root `package.json`).
- Add/remove channels only ever touches the user-curated master list `public/channels.xml` — never the hardcoded per-region extras inside `scripts/build-channels.js`.
- Channel selection supports catalog search (across `sites/*.channels.xml` + `channels-sources/*.channels.xml`) **and** manual entry — both required.
- Single admin password only (`ADMIN_PASSWORD_HASH`, argon2id hash, env var, never committed). No multi-user accounts.
- Session cookie: httpOnly, `Secure`, `SameSite=Lax`, signed, short expiry (12h).
- Failed logins rate-limited per IP: lockout after 5 attempts / 15 minutes.
- The entire `/admin` site requires a valid session — no unauthenticated read-only views.
- Two Coolify volumes required at deploy time: `/epg/public` (all served XML + master channel list) and `/epg/data` (small, non-web-served, holds Plan 2's `jobs.db`).
- All new library code lives under `web/lib/` and must be independently unit-testable (env-var-overridable paths, no hardcoded absolute paths).

---

### Task 1: Scaffold the Next.js app

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/next.config.js`
- Create: `web/next-env.d.ts`
- Create: `web/jest.config.js`
- Create: `web/app/globals.css`
- Create: `web/app/layout.tsx`
- Create: `web/app/page.tsx`
- Modify: `.gitignore` (repo root)

**Interfaces:**
- Produces: a buildable Next.js app at `web/`, with `npm test` runnable from `web/` and matching `<rootDir>/lib/**/*.test.ts`.

- [ ] **Step 1: Create `web/package.json`**

```json
{
  "name": "epg-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "test": "jest"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@node-rs/argon2": "^2.0.2"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "jest": "^29.7.0",
    "@swc/core": "^1.10.0",
    "@swc/jest": "^0.2.37",
    "@types/jest": "^29.5.0"
  }
}
```

`better-sqlite3` is deliberately **not** included here even though Plan 2
needs it: it requires native compilation (no prebuilt musl/Alpine binary),
and this repo's `Dockerfile` doesn't install a build toolchain (`python3`,
`make`, `g++`). Adding it now was tried during execution and immediately
needed `--ignore-scripts` to install locally — a strong signal it would
also fail `docker build` in Task 13, which does a plain `npm install` with
no such flag. Plan 2 must either add the build toolchain to the Dockerfile
alongside `better-sqlite3`, or pick a SQLite binding with real Alpine
prebuilds, and verify a Docker build before relying on it.

- [ ] **Step 2: Create `web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `web/next.config.js`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
```

- [ ] **Step 4: Create `web/next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

- [ ] **Step 5: Create `web/jest.config.js`**

```js
module.exports = {
  transform: { '^.+\\.(t|j)sx?$': ['@swc/jest'] },
  testMatch: ['<rootDir>/lib/**/*.test.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
}
```

- [ ] **Step 6: Create `web/app/globals.css`**

```css
:root {
  color-scheme: light dark;
}

body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 2rem;
  line-height: 1.5;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid #8884;
}

input,
button {
  font: inherit;
  padding: 0.4rem 0.6rem;
}

.error {
  color: #c0392b;
}
```

- [ ] **Step 7: Create `web/app/layout.tsx`**

```tsx
import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'EPG Admin'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Create `web/app/page.tsx`**

```tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/admin')
}
```

- [ ] **Step 9: Update `.gitignore`**

Add these three lines to the existing `.gitignore` (repo root):

```
/web/node_modules/
/web/.next/
/data/
```

- [ ] **Step 10: Install dependencies and verify the app builds**

Run: `cd web && npm install && npm run build`
Expected: completes with `Compiled successfully` (a couple of Next.js
warnings about the redirect-only root page are fine; there must be no
errors).

- [ ] **Step 11: Commit**

```bash
git add web .gitignore
git commit -m "scaffold Next.js admin app skeleton"
```

---

### Task 2: `lib/paths.ts` — env-overridable filesystem paths

**Files:**
- Create: `web/lib/paths.ts`
- Test: `web/lib/paths.test.ts`

**Interfaces:**
- Produces:
  - `publicDir(): string`
  - `dataDir(): string`
  - `sitesDir(): string`
  - `channelsSourcesDir(): string`
  - `channelsXmlPath(): string`
  - `jobsDbPath(): string`
  - `locksDir(): string`
  - All read `process.env.EPG_PUBLIC_DIR` / `EPG_DATA_DIR` / `EPG_SITES_DIR` /
    `EPG_CHANNELS_SOURCES_DIR` on every call (functions, not cached consts) so
    tests can override them per-test without module-cache issues.

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/paths.test.ts
import path from 'path'
import {
  publicDir,
  dataDir,
  sitesDir,
  channelsSourcesDir,
  channelsXmlPath,
  jobsDbPath,
  locksDir
} from '@/lib/paths'

describe('paths', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('uses env var overrides when set', () => {
    process.env.EPG_PUBLIC_DIR = '/tmp/fake-public'
    process.env.EPG_DATA_DIR = '/tmp/fake-data'
    process.env.EPG_SITES_DIR = '/tmp/fake-sites'
    process.env.EPG_CHANNELS_SOURCES_DIR = '/tmp/fake-sources'

    expect(publicDir()).toBe('/tmp/fake-public')
    expect(dataDir()).toBe('/tmp/fake-data')
    expect(sitesDir()).toBe('/tmp/fake-sites')
    expect(channelsSourcesDir()).toBe('/tmp/fake-sources')
    expect(channelsXmlPath()).toBe(path.join('/tmp/fake-public', 'channels.xml'))
    expect(jobsDbPath()).toBe(path.join('/tmp/fake-data', 'jobs.db'))
    expect(locksDir()).toBe(path.join('/tmp/fake-data', 'locks'))
  })

  it('falls back to repo-relative defaults when env vars are unset', () => {
    delete process.env.EPG_PUBLIC_DIR
    const expected = path.resolve(process.cwd(), '..', 'public')
    expect(publicDir()).toBe(expected)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- paths.test.ts`
Expected: FAIL — `Cannot find module '@/lib/paths'` (the module doesn't
exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/paths.ts
import path from 'path'

function repoRoot(): string {
  return path.resolve(process.cwd(), '..')
}

export function publicDir(): string {
  return process.env.EPG_PUBLIC_DIR || path.join(repoRoot(), 'public')
}

export function dataDir(): string {
  return process.env.EPG_DATA_DIR || path.join(repoRoot(), 'data')
}

export function sitesDir(): string {
  return process.env.EPG_SITES_DIR || path.join(repoRoot(), 'sites')
}

export function channelsSourcesDir(): string {
  return process.env.EPG_CHANNELS_SOURCES_DIR || path.join(repoRoot(), 'channels-sources')
}

export function channelsXmlPath(): string {
  return path.join(publicDir(), 'channels.xml')
}

export function jobsDbPath(): string {
  return path.join(dataDir(), 'jobs.db')
}

export function locksDir(): string {
  return path.join(dataDir(), 'locks')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- paths.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add web/lib/paths.ts web/lib/paths.test.ts
git commit -m "add env-overridable filesystem paths module"
```

---

### Task 3: `lib/channels.ts` — parse/serialize/read/write/add/remove

**Files:**
- Create: `web/lib/channels.ts`
- Test: `web/lib/channels.test.ts`

**Interfaces:**
- Consumes: `channelsXmlPath()` from `@/lib/paths`
- Produces:
  - `interface Channel { site: string; siteId: string; lang: string; xmltvId: string; name: string }`
  - `escapeXml(value: string): string`
  - `parseChannelsXml(xml: string): Channel[]`
  - `serializeChannelsXml(channels: Channel[]): string`
  - `readChannels(): Channel[]`
  - `writeChannels(channels: Channel[]): void`
  - `type AddChannelResult = { ok: true } | { ok: false; error: 'duplicate' }`
  - `addChannel(channel: Channel): AddChannelResult`
  - `type RemoveChannelResult = { ok: true } | { ok: false; error: 'not_found' }`
  - `removeChannel(site: string, siteId: string): RemoveChannelResult`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/channels.test.ts
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  Channel,
  parseChannelsXml,
  serializeChannelsXml,
  readChannels,
  writeChannels,
  addChannel,
  removeChannel
} from '@/lib/channels'

describe('channels xml parsing', () => {
  it('parses well-formed channel lines', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<channels>\n  <channel site="example.com" site_id="CH1" lang="en" xmltv_id="Example.us">Example Channel</channel>\n</channels>\n`
    const channels = parseChannelsXml(xml)
    expect(channels).toEqual<Channel[]>([
      { site: 'example.com', siteId: 'CH1', lang: 'en', xmltvId: 'Example.us', name: 'Example Channel' }
    ])
  })

  it('skips lines missing required attributes', () => {
    const xml = `<channels>\n  <channel site="" site_id="CH1" lang="en">No Site</channel>\n</channels>`
    expect(parseChannelsXml(xml)).toEqual([])
  })

  it('round-trips through serialize + parse, escaping special characters', () => {
    const channels: Channel[] = [
      { site: 'a&b.com', siteId: 'CH<1>', lang: 'en', xmltvId: '', name: 'Rock & "Roll"' }
    ]
    const xml = serializeChannelsXml(channels)
    expect(parseChannelsXml(xml)).toEqual(channels)
  })
})

describe('channels file storage', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epg-channels-test-'))
    process.env.EPG_PUBLIC_DIR = tmpDir
  })

  afterEach(() => {
    delete process.env.EPG_PUBLIC_DIR
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('readChannels returns an empty array when the file does not exist', () => {
    expect(readChannels()).toEqual([])
  })

  it('writeChannels then readChannels round-trips', () => {
    const channels: Channel[] = [
      { site: 'example.com', siteId: 'CH1', lang: 'en', xmltvId: '', name: 'Example' }
    ]
    writeChannels(channels)
    expect(readChannels()).toEqual(channels)
  })

  it('addChannel appends a new channel', () => {
    const result = addChannel({ site: 'a.com', siteId: 'A1', lang: 'en', xmltvId: '', name: 'A' })
    expect(result).toEqual({ ok: true })
    expect(readChannels()).toEqual([{ site: 'a.com', siteId: 'A1', lang: 'en', xmltvId: '', name: 'A' }])
  })

  it('addChannel rejects a duplicate site+siteId', () => {
    addChannel({ site: 'a.com', siteId: 'A1', lang: 'en', xmltvId: '', name: 'A' })
    const result = addChannel({ site: 'a.com', siteId: 'A1', lang: 'en', xmltvId: '', name: 'A dup' })
    expect(result).toEqual({ ok: false, error: 'duplicate' })
    expect(readChannels()).toHaveLength(1)
  })

  it('removeChannel removes a matching channel', () => {
    addChannel({ site: 'a.com', siteId: 'A1', lang: 'en', xmltvId: '', name: 'A' })
    const result = removeChannel('a.com', 'A1')
    expect(result).toEqual({ ok: true })
    expect(readChannels()).toEqual([])
  })

  it('removeChannel returns not_found when there is no match', () => {
    const result = removeChannel('missing.com', 'X')
    expect(result).toEqual({ ok: false, error: 'not_found' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- channels.test.ts`
Expected: FAIL — `Cannot find module '@/lib/channels'`

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/channels.ts
import fs from 'fs'
import path from 'path'
import { channelsXmlPath } from '@/lib/paths'

export interface Channel {
  site: string
  siteId: string
  lang: string
  xmltvId: string
  name: string
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function parseChannelsXml(xml: string): Channel[] {
  const channels: Channel[] = []
  for (const line of xml.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('<channel ')) continue
    const site = (trimmed.match(/\bsite="([^"]*)"/) || [])[1] || ''
    const siteId = (trimmed.match(/\bsite_id="([^"]*)"/) || [])[1] || ''
    const lang = (trimmed.match(/\blang="([^"]*)"/) || [])[1] || ''
    const xmltvId = (trimmed.match(/\bxmltv_id="([^"]*)"/) || [])[1] || ''
    const nameMatch = trimmed.match(/>([^<]*)<\/channel>/)
    const name = (nameMatch ? nameMatch[1] : '').trim()
    if (!site || !siteId || !name) continue
    channels.push({ site, siteId, lang, xmltvId, name })
  }
  return channels
}

export function serializeChannelsXml(channels: Channel[]): string {
  const lines = channels.map(
    ch =>
      `  <channel site="${escapeXml(ch.site)}" site_id="${escapeXml(ch.siteId)}" lang="${escapeXml(ch.lang)}" xmltv_id="${escapeXml(ch.xmltvId)}">${escapeXml(ch.name)}</channel>`
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<channels>\n${lines.join('\n')}\n</channels>\n`
}

export function readChannels(): Channel[] {
  const filePath = channelsXmlPath()
  if (!fs.existsSync(filePath)) return []
  return parseChannelsXml(fs.readFileSync(filePath, 'utf8'))
}

export function writeChannels(channels: Channel[]): void {
  const filePath = channelsXmlPath()
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, serializeChannelsXml(channels))
}

export type AddChannelResult = { ok: true } | { ok: false; error: 'duplicate' }
export type RemoveChannelResult = { ok: true } | { ok: false; error: 'not_found' }

export function addChannel(channel: Channel): AddChannelResult {
  const channels = readChannels()
  const exists = channels.some(ch => ch.site === channel.site && ch.siteId === channel.siteId)
  if (exists) return { ok: false, error: 'duplicate' }
  channels.push(channel)
  writeChannels(channels)
  return { ok: true }
}

export function removeChannel(site: string, siteId: string): RemoveChannelResult {
  const channels = readChannels()
  const next = channels.filter(ch => !(ch.site === site && ch.siteId === siteId))
  if (next.length === channels.length) return { ok: false, error: 'not_found' }
  writeChannels(next)
  return { ok: true }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- channels.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add web/lib/channels.ts web/lib/channels.test.ts
git commit -m "add channels.xml read/write/add/remove logic"
```

---

### Task 4: `lib/catalog.ts` — searchable catalog index

**Files:**
- Create: `web/lib/catalog.ts`
- Test: `web/lib/catalog.test.ts`

**Interfaces:**
- Consumes: `parseChannelsXml`, `Channel` from `@/lib/channels`; `sitesDir()`,
  `channelsSourcesDir()` from `@/lib/paths`
- Produces:
  - `type CatalogEntry = Channel`
  - `buildCatalogIndex(): CatalogEntry[]`
  - `searchCatalog(index: CatalogEntry[], query: string): CatalogEntry[]`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/catalog.test.ts
import fs from 'fs'
import os from 'os'
import path from 'path'
import { buildCatalogIndex, searchCatalog, CatalogEntry } from '@/lib/catalog'

describe('catalog index', () => {
  let tmpRoot: string

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'epg-catalog-test-'))
    const sitesDir = path.join(tmpRoot, 'sites')
    const sourcesDir = path.join(tmpRoot, 'channels-sources')
    fs.mkdirSync(path.join(sitesDir, 'example.com'), { recursive: true })
    fs.mkdirSync(sourcesDir, { recursive: true })

    fs.writeFileSync(
      path.join(sitesDir, 'example.com', 'example.com.channels.xml'),
      `<channels>\n  <channel site="example.com" site_id="CH1" lang="en" xmltv_id="Example.us">Example One</channel>\n</channels>`
    )
    fs.writeFileSync(
      path.join(sourcesDir, 'extra.channels.xml'),
      `<channels>\n  <channel site="extra.com" site_id="EX1" lang="en" xmltv_id="">Extra Sports</channel>\n</channels>`
    )

    process.env.EPG_SITES_DIR = sitesDir
    process.env.EPG_CHANNELS_SOURCES_DIR = sourcesDir
  })

  afterEach(() => {
    delete process.env.EPG_SITES_DIR
    delete process.env.EPG_CHANNELS_SOURCES_DIR
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  })

  it('indexes channels from both sites/ subfolders and channels-sources/', () => {
    const index = buildCatalogIndex()
    expect(index).toHaveLength(2)
    expect(index.map(e => e.name).sort()).toEqual(['Example One', 'Extra Sports'])
  })

  it('searchCatalog matches by name or site, case-insensitively', () => {
    const index: CatalogEntry[] = [
      { site: 'example.com', siteId: 'CH1', lang: 'en', xmltvId: '', name: 'Example One' },
      { site: 'extra.com', siteId: 'EX1', lang: 'en', xmltvId: '', name: 'Extra Sports' }
    ]
    expect(searchCatalog(index, 'sport').map(e => e.name)).toEqual(['Extra Sports'])
    expect(searchCatalog(index, 'EXAMPLE').map(e => e.name)).toEqual(['Example One'])
    expect(searchCatalog(index, 'extra.com').map(e => e.name)).toEqual(['Extra Sports'])
  })

  it('searchCatalog returns an empty array for a blank query', () => {
    expect(searchCatalog([{ site: 'a', siteId: 'b', lang: 'en', xmltvId: '', name: 'c' }], '   ')).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- catalog.test.ts`
Expected: FAIL — `Cannot find module '@/lib/catalog'`

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/catalog.ts
import fs from 'fs'
import path from 'path'
import { parseChannelsXml, Channel } from '@/lib/channels'
import { sitesDir, channelsSourcesDir } from '@/lib/paths'

export type CatalogEntry = Channel

function readChannelsFileSafe(filePath: string): Channel[] {
  if (!fs.existsSync(filePath)) return []
  return parseChannelsXml(fs.readFileSync(filePath, 'utf8'))
}

export function buildCatalogIndex(): CatalogEntry[] {
  const entries: CatalogEntry[] = []

  const sitesRoot = sitesDir()
  if (fs.existsSync(sitesRoot)) {
    for (const siteName of fs.readdirSync(sitesRoot)) {
      const siteDir = path.join(sitesRoot, siteName)
      if (!fs.statSync(siteDir).isDirectory()) continue
      for (const file of fs.readdirSync(siteDir)) {
        if (!file.endsWith('.channels.xml')) continue
        entries.push(...readChannelsFileSafe(path.join(siteDir, file)))
      }
    }
  }

  const sourcesRoot = channelsSourcesDir()
  if (fs.existsSync(sourcesRoot)) {
    for (const file of fs.readdirSync(sourcesRoot)) {
      if (!file.endsWith('.channels.xml')) continue
      entries.push(...readChannelsFileSafe(path.join(sourcesRoot, file)))
    }
  }

  return entries
}

export function searchCatalog(index: CatalogEntry[], query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return index.filter(
    entry => entry.name.toLowerCase().includes(q) || entry.site.toLowerCase().includes(q)
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- catalog.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add web/lib/catalog.ts web/lib/catalog.test.ts
git commit -m "add channel catalog index and search"
```

---

### Task 5: `lib/auth.ts` — password verification and session tokens

**Files:**
- Create: `web/lib/auth.ts`
- Test: `web/lib/auth.test.ts`

**Interfaces:**
- Produces:
  - `verifyPassword(password: string): Promise<boolean>` (reads `ADMIN_PASSWORD_HASH` env var)
  - `createSessionToken(ttlMs?: number): string` (reads `SESSION_SECRET` env var; default ttl 12h)
  - `verifySessionToken(token: string | undefined | null): boolean`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/auth.test.ts
import { hash } from '@node-rs/argon2'
import { verifyPassword, createSessionToken, verifySessionToken } from '@/lib/auth'

describe('auth', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    process.env.SESSION_SECRET = 'test-secret-value'
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  describe('verifyPassword', () => {
    it('returns true for the correct password', async () => {
      process.env.ADMIN_PASSWORD_HASH = await hash('correct-horse-battery-staple')
      await expect(verifyPassword('correct-horse-battery-staple')).resolves.toBe(true)
    })

    it('returns false for an incorrect password', async () => {
      process.env.ADMIN_PASSWORD_HASH = await hash('correct-horse-battery-staple')
      await expect(verifyPassword('wrong-password')).resolves.toBe(false)
    })
  })

  describe('session tokens', () => {
    it('round-trips a freshly created token as valid', () => {
      const token = createSessionToken()
      expect(verifySessionToken(token)).toBe(true)
    })

    it('rejects a tampered token', () => {
      const token = createSessionToken()
      expect(verifySessionToken(token + 'x')).toBe(false)
    })

    it('rejects an expired token', () => {
      const token = createSessionToken(-1000)
      expect(verifySessionToken(token)).toBe(false)
    })

    it('rejects a missing token', () => {
      expect(verifySessionToken(undefined)).toBe(false)
      expect(verifySessionToken(null)).toBe(false)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- auth.test.ts`
Expected: FAIL — `Cannot find module '@/lib/auth'`

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/auth.ts
import { verify as argon2Verify } from '@node-rs/argon2'
import crypto from 'crypto'

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) throw new Error('ADMIN_PASSWORD_HASH is not set')
  return argon2Verify(hash, password)
}

interface SessionPayload {
  exp: number
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return secret
}

export function createSessionToken(ttlMs = 12 * 60 * 60 * 1000): string {
  const payload: SessionPayload = { exp: Date.now() + ttlMs }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url')
  return `${body}.${signature}`
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [body, signature] = parts
  const expectedSignature = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url')
  const signatureBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expectedSignature)
  if (signatureBuf.length !== expectedBuf.length) return false
  if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return false
  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    return payload.exp > Date.now()
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- auth.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add web/lib/auth.ts web/lib/auth.test.ts
git commit -m "add password verification and signed session tokens"
```

---

### Task 6: `lib/rateLimit.ts` — per-IP login lockout

**Files:**
- Create: `web/lib/rateLimit.ts`
- Test: `web/lib/rateLimit.test.ts`

**Interfaces:**
- Produces:
  - `isLockedOut(key: string, now?: number): boolean`
  - `recordFailedAttempt(key: string, now?: number): void`
  - `clearAttempts(key: string): void`
  - Constants: lockout after 5 failed attempts within a 15-minute window.

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/rateLimit.test.ts
import { isLockedOut, recordFailedAttempt, clearAttempts } from '@/lib/rateLimit'

describe('rateLimit', () => {
  const KEY = '203.0.113.5'

  afterEach(() => {
    clearAttempts(KEY)
  })

  it('is not locked out with no attempts', () => {
    expect(isLockedOut(KEY)).toBe(false)
  })

  it('locks out after 5 failed attempts within the window', () => {
    const now = 1_000_000
    for (let i = 0; i < 5; i++) recordFailedAttempt(KEY, now + i)
    expect(isLockedOut(KEY, now + 5)).toBe(true)
  })

  it('does not lock out after only 4 failed attempts', () => {
    const now = 1_000_000
    for (let i = 0; i < 4; i++) recordFailedAttempt(KEY, now + i)
    expect(isLockedOut(KEY, now + 4)).toBe(false)
  })

  it('resets the window once 15 minutes have passed', () => {
    const now = 1_000_000
    for (let i = 0; i < 5; i++) recordFailedAttempt(KEY, now + i)
    const sixteenMinutesLater = now + 16 * 60 * 1000
    expect(isLockedOut(KEY, sixteenMinutesLater)).toBe(false)
  })

  it('clearAttempts resets the counter immediately', () => {
    const now = 1_000_000
    for (let i = 0; i < 5; i++) recordFailedAttempt(KEY, now + i)
    clearAttempts(KEY)
    expect(isLockedOut(KEY, now + 5)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- rateLimit.test.ts`
Expected: FAIL — `Cannot find module '@/lib/rateLimit'`

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/rateLimit.ts
interface Attempt {
  count: number
  firstAttemptAt: number
}

const attempts = new Map<string, Attempt>()

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

export function isLockedOut(key: string, now: number = Date.now()): boolean {
  const attempt = attempts.get(key)
  if (!attempt) return false
  if (now - attempt.firstAttemptAt > WINDOW_MS) {
    attempts.delete(key)
    return false
  }
  return attempt.count >= MAX_ATTEMPTS
}

export function recordFailedAttempt(key: string, now: number = Date.now()): void {
  const attempt = attempts.get(key)
  if (!attempt || now - attempt.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: now })
    return
  }
  attempt.count += 1
}

export function clearAttempts(key: string): void {
  attempts.delete(key)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- rateLimit.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add web/lib/rateLimit.ts web/lib/rateLimit.test.ts
git commit -m "add per-IP login rate limiting"
```

---

### Task 7: Session guards, login/logout routes, and the login page

**Files:**
- Create: `web/lib/session.ts`
- Create: `web/app/api/admin/auth/login/route.ts`
- Create: `web/app/api/admin/auth/logout/route.ts`
- Create: `web/app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `verifyPassword`, `createSessionToken`, `verifySessionToken` from
  `@/lib/auth`; `isLockedOut`, `recordFailedAttempt`, `clearAttempts` from
  `@/lib/rateLimit`
- Produces:
  - `requireSession(): Promise<void>` — for use at the top of protected
    Server Component pages; redirects to `/admin/login` if invalid.
  - `isAuthorized(request: NextRequest): boolean` — for use at the top of
    protected Route Handlers.
  - Cookie name: `epg_admin_session`.

This task has no unit tests of its own (the logic it wires together —
`auth.ts` and `rateLimit.ts` — is already covered); it's verified by manually
running the dev server and exercising the login flow with `curl`.

- [ ] **Step 1: Create `web/lib/session.ts`**

```ts
// web/lib/session.ts
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { verifySessionToken } from '@/lib/auth'

export const SESSION_COOKIE = 'epg_admin_session'

export async function requireSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!verifySessionToken(token)) {
    redirect('/admin/login')
  }
}

export function isAuthorized(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  return verifySessionToken(token)
}
```

- [ ] **Step 2: Create the login API route**

```ts
// web/app/api/admin/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSessionToken } from '@/lib/auth'
import { isLockedOut, recordFailedAttempt, clearAttempts } from '@/lib/rateLimit'
import { SESSION_COOKIE } from '@/lib/session'

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (!forwardedFor) return 'unknown'
  const parts = forwardedFor.split(',').map(part => part.trim())
  return parts[parts.length - 1] || 'unknown'
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  if (isLockedOut(ip)) {
    return NextResponse.json({ error: 'too many attempts, try again later' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const password = typeof body?.password === 'string' ? body.password : ''
  const valid = password.length > 0 && (await verifyPassword(password))

  if (!valid) {
    recordFailedAttempt(ip)
    return NextResponse.json({ error: 'invalid password' }, { status: 401 })
  }

  clearAttempts(ip)
  const token = createSessionToken()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 60 * 60
  })
  return response
}
```

`getClientIp` takes the *last* comma-separated hop of `X-Forwarded-For`
rather than the raw header, because the raw header is client-settable and
using it verbatim lets an attacker spoof a new value per request and never
trip the lockout. Caddy (the container's sole entry point, added in Task 12)
appends the real client address as the last hop rather than overwriting the
header, so the last hop is the one value the client cannot control.

- [ ] **Step 3: Create the logout API route**

```ts
// web/app/api/admin/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
```

- [ ] **Step 4: Create the login page**

```tsx
// web/app/admin/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })

    setSubmitting(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'login failed' }))
      setError(data.error || 'login failed')
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <main>
      <h1>EPG Admin Login</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="password">Password</label>
        <br />
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoFocus
        />
        <br />
        <br />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </main>
  )
}
```

- [ ] **Step 5: Generate a local test password hash**

Run: `cd web && node -e "require('@node-rs/argon2').hash('test-password-123').then(h => console.log(h))"`
Expected: prints an `$argon2id$...` string. Copy it for the next step.

- [ ] **Step 6: Manually verify the login flow**

Run (in `web/`, with the hash from Step 5):

```bash
ADMIN_PASSWORD_HASH='<paste the hash>' SESSION_SECRET='local-dev-secret' npm run dev
```

In another terminal:

```bash
curl -i -X POST http://localhost:3001/api/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"password":"wrong"}'
```

Expected: `HTTP/1.1 401` with `{"error":"invalid password"}`.

```bash
curl -i -X POST http://localhost:3001/api/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"password":"test-password-123"}'
```

Expected: `HTTP/1.1 200` with `{"ok":true}` and a `Set-Cookie: epg_admin_session=...` header.

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 7: Commit**

```bash
git add web/lib/session.ts web/app/api/admin/auth web/app/admin/login
git commit -m "add session guard, login/logout routes, and login page"
```

---

### Task 8: Channels API routes (list / add / remove)

**Files:**
- Create: `web/app/api/admin/channels/route.ts`

**Interfaces:**
- Consumes: `readChannels`, `addChannel`, `removeChannel`, `Channel` from
  `@/lib/channels`; `isAuthorized` from `@/lib/session`
- Produces: `GET /api/admin/channels`, `POST /api/admin/channels`,
  `DELETE /api/admin/channels?site=...&siteId=...`

- [ ] **Step 1: Create the route**

```ts
// web/app/api/admin/channels/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { execFileSync } from 'child_process'
import path from 'path'
import { readChannels, addChannel, removeChannel, Channel } from '@/lib/channels'
import { isAuthorized } from '@/lib/session'

function rebuildChannelFiles() {
  execFileSync('node', ['scripts/build-channels.js'], {
    cwd: path.resolve(process.cwd(), '..')
  })
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ channels: readChannels() })
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const site = typeof body?.site === 'string' ? body.site.trim() : ''
  const siteId = typeof body?.siteId === 'string' ? body.siteId.trim() : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const lang = typeof body?.lang === 'string' && body.lang.trim() ? body.lang.trim() : 'en'
  const xmltvId = typeof body?.xmltvId === 'string' ? body.xmltvId.trim() : ''

  if (!site || !siteId || !name) {
    return NextResponse.json({ error: 'site, siteId and name are required' }, { status: 400 })
  }

  const channel: Channel = { site, siteId, lang, xmltvId, name }
  const result = addChannel(channel)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  rebuildChannelFiles()
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const site = searchParams.get('site')
  const siteId = searchParams.get('siteId')

  if (!site || !siteId) {
    return NextResponse.json({ error: 'site and siteId query params are required' }, { status: 400 })
  }

  const result = removeChannel(site, siteId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  rebuildChannelFiles()
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Manually verify (unauthenticated request is rejected)**

Run: `cd web && npm run dev` (with `ADMIN_PASSWORD_HASH`/`SESSION_SECRET` set as in Task 7)

```bash
curl -i http://localhost:3001/api/admin/channels
```

Expected: `HTTP/1.1 401`

- [ ] **Step 3: Manually verify the authenticated add/list/remove flow**

Log in first to capture a cookie jar, then reuse it:

```bash
curl -c /tmp/epg-cookies.txt -s -X POST http://localhost:3001/api/admin/auth/login \
  -H 'Content-Type: application/json' -d '{"password":"test-password-123"}' > /dev/null

curl -b /tmp/epg-cookies.txt -i -X POST http://localhost:3001/api/admin/channels \
  -H 'Content-Type: application/json' \
  -d '{"site":"example.com","siteId":"CH1","lang":"en","xmltvId":"","name":"Example"}'
```

Expected: `HTTP/1.1 201` with `{"ok":true}`.

```bash
curl -b /tmp/epg-cookies.txt -s http://localhost:3001/api/admin/channels
```

Expected: `{"channels":[{"site":"example.com","siteId":"CH1","lang":"en","xmltvId":"","name":"Example"}]}`

```bash
curl -b /tmp/epg-cookies.txt -i -X DELETE 'http://localhost:3001/api/admin/channels?site=example.com&siteId=CH1'
```

Expected: `HTTP/1.1 200` with `{"ok":true}`, and the previous list request now
returns `{"channels":[]}`.

Stop the dev server once confirmed.

- [ ] **Step 4: Commit**

```bash
git add web/app/api/admin/channels/route.ts
git commit -m "add channels list/add/remove API route"
```

---

### Task 9: Catalog search API route

**Files:**
- Create: `web/app/api/admin/channels/search/route.ts`

**Interfaces:**
- Consumes: `buildCatalogIndex`, `searchCatalog` from `@/lib/catalog`;
  `isAuthorized` from `@/lib/session`
- Produces: `GET /api/admin/channels/search?q=...`

- [ ] **Step 1: Create the route**

```ts
// web/app/api/admin/channels/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { buildCatalogIndex, searchCatalog, CatalogEntry } from '@/lib/catalog'
import { isAuthorized } from '@/lib/session'

let cachedIndex: CatalogEntry[] | null = null

function getIndex(): CatalogEntry[] {
  if (!cachedIndex) cachedIndex = buildCatalogIndex()
  return cachedIndex
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const results = searchCatalog(getIndex(), query).slice(0, 50)
  return NextResponse.json({ results })
}
```

The index is built once per process (it scans the whole `sites/` catalog,
which doesn't change at runtime) and cached in memory — cheap enough that no
persistence is needed.

- [ ] **Step 2: Manually verify**

With the dev server running and the cookie jar from Task 8:

```bash
curl -b /tmp/epg-cookies.txt -s 'http://localhost:3001/api/admin/channels/search?q=bbc' | head -c 500
```

Expected: `HTTP 200` with a `{"results":[...]}` array containing entries whose
`name` or `site` contains "bbc" (case-insensitive), sourced from the real
`sites/` directory checked out at the repo root.

- [ ] **Step 3: Commit**

```bash
git add web/app/api/admin/channels/search/route.ts
git commit -m "add channel catalog search API route"
```

---

### Task 10: Channels admin UI page

**Files:**
- Create: `web/app/admin/channels/page.tsx`
- Create: `web/app/admin/channels/ChannelsClient.tsx`

**Interfaces:**
- Consumes: `requireSession` from `@/lib/session` (server-side guard);
  `GET/POST/DELETE /api/admin/channels`, `GET /api/admin/channels/search`
  (client-side fetches)

- [ ] **Step 1: Create the server component wrapper (auth guard)**

```tsx
// web/app/admin/channels/page.tsx
import { requireSession } from '@/lib/session'
import ChannelsClient from './ChannelsClient'

export default async function ChannelsPage() {
  await requireSession()
  return <ChannelsClient />
}
```

- [ ] **Step 2: Create the client component**

```tsx
// web/app/admin/channels/ChannelsClient.tsx
'use client'

import { useEffect, useState } from 'react'

interface Channel {
  site: string
  siteId: string
  lang: string
  xmltvId: string
  name: string
}

interface CatalogEntry extends Channel {}

export default function ChannelsClient() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CatalogEntry[]>([])
  const [manual, setManual] = useState({ site: '', siteId: '', lang: 'en', xmltvId: '', name: '' })
  const [message, setMessage] = useState<string | null>(null)

  async function loadChannels() {
    const response = await fetch('/api/admin/channels')
    const data = await response.json()
    setChannels(data.channels || [])
  }

  useEffect(() => {
    loadChannels()
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const controller = new AbortController()
    fetch(`/api/admin/channels/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => setResults(data.results || []))
      .catch(() => {})
    return () => controller.abort()
  }, [query])

  async function addChannel(channel: Channel) {
    setMessage(null)
    const response = await fetch('/api/admin/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(channel)
    })
    const data = await response.json()
    if (!response.ok) {
      setMessage(`Error: ${data.error}`)
      return
    }
    setMessage(`Added "${channel.name}" — run a fetch to pull its schedule.`)
    await loadChannels()
  }

  async function removeChannel(site: string, siteId: string) {
    setMessage(null)
    const response = await fetch(
      `/api/admin/channels?site=${encodeURIComponent(site)}&siteId=${encodeURIComponent(siteId)}`,
      { method: 'DELETE' }
    )
    const data = await response.json()
    if (!response.ok) {
      setMessage(`Error: ${data.error}`)
      return
    }
    await loadChannels()
  }

  return (
    <main>
      <h1>Channels</h1>
      {message && <p>{message}</p>}

      <section>
        <h2>Add from catalog</h2>
        <input
          placeholder="Search by channel name or site (e.g. bbc)"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <ul>
          {results.map(entry => (
            <li key={`${entry.site}|${entry.siteId}`}>
              {entry.name} ({entry.site}, {entry.lang}){' '}
              <button onClick={() => addChannel(entry)}>Add</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Add manually</h2>
        <form
          onSubmit={e => {
            e.preventDefault()
            addChannel(manual)
          }}
        >
          <input
            placeholder="site (e.g. example.com)"
            value={manual.site}
            onChange={e => setManual({ ...manual, site: e.target.value })}
          />
          <input
            placeholder="site_id"
            value={manual.siteId}
            onChange={e => setManual({ ...manual, siteId: e.target.value })}
          />
          <input
            placeholder="lang"
            value={manual.lang}
            onChange={e => setManual({ ...manual, lang: e.target.value })}
          />
          <input
            placeholder="xmltv_id (optional)"
            value={manual.xmltvId}
            onChange={e => setManual({ ...manual, xmltvId: e.target.value })}
          />
          <input
            placeholder="display name"
            value={manual.name}
            onChange={e => setManual({ ...manual, name: e.target.value })}
          />
          <button type="submit">Add</button>
        </form>
      </section>

      <section>
        <h2>Current channels ({channels.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Site</th>
              <th>Lang</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {channels.map(ch => (
              <tr key={`${ch.site}|${ch.siteId}`}>
                <td>{ch.name}</td>
                <td>{ch.site}</td>
                <td>{ch.lang}</td>
                <td>
                  <button onClick={() => removeChannel(ch.site, ch.siteId)}>Remove</button>
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

Run: `cd web && npm run dev` (with env vars from Task 7).
Visit `http://localhost:3001/admin/channels` — expect a redirect to
`/admin/login` since there's no session cookie in the browser. Log in with
`test-password-123`, then visit `/admin/channels` again — expect the page to
load, the catalog search box to return results when typing a known channel
name (e.g. "bbc"), "Add" to add it to the "Current channels" table below, and
"Remove" to remove it again.

- [ ] **Step 4: Commit**

```bash
git add web/app/admin/channels
git commit -m "add channels admin UI page"
```

---

### Task 11: Dashboard shell page

**Files:**
- Create: `web/app/admin/page.tsx`

**Interfaces:**
- Consumes: `requireSession` from `@/lib/session`

- [ ] **Step 1: Create the dashboard page**

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
      </ul>
      <p>
        On-demand fetch, job status, and logs are added in a follow-up
        change — channel changes here take effect the next time the existing
        scheduled fetch runs.
      </p>
    </main>
  )
}
```

- [ ] **Step 2: Manually verify**

With the dev server running, visit `http://localhost:3001/admin` — expect a
redirect to login when logged out, and the dashboard with a working
"Manage channels" link once logged in.

- [ ] **Step 3: Commit**

```bash
git add web/app/admin/page.tsx
git commit -m "add admin dashboard shell page"
```

---

### Task 12: Caddy routing, pm2 entries, and Dockerfile/volume changes

**Files:**
- Create: `Caddyfile` (repo root)
- Modify: `pm2.config.js`
- Modify: `Dockerfile`

**Interfaces:**
- Produces: container listens on port 3000 via Caddy; `/admin*` and
  `/api/admin/*` proxy to `127.0.0.1:3001` (the `web` pm2 app); everything
  else proxies to `127.0.0.1:3002` (the `serve` pm2 app, moved off 3000).

- [ ] **Step 1: Create `Caddyfile`**

```
:3000 {
	handle /admin* {
		reverse_proxy 127.0.0.1:3001
	}

	handle /api/admin/* {
		reverse_proxy 127.0.0.1:3001
	}

	handle {
		reverse_proxy 127.0.0.1:3002
	}
}
```

- [ ] **Step 2: Modify `pm2.config.js`**

Change the `serve` app's script to bind port 3002 instead of the implicit
3000, and add `caddy` + `web` app entries. Full resulting `apps` array
(only the `serve` entry and the two new entries change — everything else
in the file, including `grabAll`, `regions`, and `buildAndGrabAll`, stays
exactly as-is):

```js
const apps = [
  {
    name: 'serve',
    script: 'npx serve -- public -l 3002',
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
    script: 'npm',
    args: 'start',
    cwd: './web',
    instances: 1,
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
    script: `npx chronos -e "bash scripts/grab-with-history.sh --channels=public/${channels} --output=public/${output}" -p "${CRON}" -l`,
    instances: 1,
    watch: false,
    autorestart: true
  }))
]
```

- [ ] **Step 3: Modify `Dockerfile`**

Add Caddy to the installed packages, build the `web/` app, and declare the
two new volume mount points. Full resulting `Dockerfile`:

```dockerfile
FROM node:22-alpine
ARG GIT_REPO=https://github.com/dj1p/epg.git
ARG GIT_BRANCH=master
ARG WORKDIR=/epg
ENV CRON_SCHEDULE="0 0 * * *"
ENV RUN_AT_STARTUP=true
RUN apk update \
    && apk upgrade --available \
    && apk add curl git tzdata bash caddy \
    && npm install pm2 -g \
    && mkdir $(echo "${WORKDIR}") -p \
    && cd $(echo "${WORKDIR}") \
    && git clone --depth 1 -b $(echo "${GIT_BRANCH}") $(echo "${GIT_REPO}") . \
    && npm install \
    && cd web \
    && npm install \
    && npm run build \
    && cd .. \
    && mkdir /public
RUN apk del git curl \
  && rm -rf /var/cache/apk/*
COPY pm2.config.js $WORKDIR
WORKDIR $WORKDIR
VOLUME ["/epg/public", "/epg/data"]
EXPOSE 3000
CMD [ "pm2-runtime", "pm2.config.js" ]
```

The `pm2.config.js` line was already there (`COPY pm2.config.js $WORKDIR`) —
no separate `COPY Caddyfile` line is needed since `Caddyfile` is already
inside the repo checked out by `git clone` into `$WORKDIR`.

- [ ] **Step 4: Commit**

```bash
git add Caddyfile pm2.config.js Dockerfile
git commit -m "route /admin through Caddy to the new web app, add volumes"
```

---

### Task 13: Local Docker verification

**Files:** none (verification only)

- [ ] **Step 1: Build the image locally**

Run: `docker build -t epg-admin-test .`
Expected: build completes successfully (this will take a few minutes — it
clones the repo fresh and runs both `npm install`s).

Note: the local build clones from `GIT_REPO`/`GIT_BRANCH` (default
`master`), not your local working tree. To test uncommitted changes,
override the build args, e.g.:
`docker build -t epg-admin-test --build-arg GIT_BRANCH=feature/admin-website .`
— this requires the branch to be pushed to GitHub first (see Task 14).

- [ ] **Step 2: Run the container with both volumes and admin env vars**

```bash
docker run -d --name epg-admin-test \
  -p 3000:3000 \
  -v epg-test-public:/epg/public \
  -v epg-test-data:/epg/data \
  -e ADMIN_PASSWORD_HASH='<hash from Task 7, Step 5>' \
  -e SESSION_SECRET='local-docker-secret' \
  epg-admin-test
```

- [ ] **Step 3: Verify existing XML paths still work**

Run: `curl -i http://localhost:3000/channels-th.xml`
Expected: `HTTP/1.1 200` (file may take a minute to appear while
`grab-at-startup` runs the first time).

- [ ] **Step 4: Verify the admin site is reachable and gated**

Run: `curl -i http://localhost:3000/admin/channels`
Expected: since this is a Server Component redirect rather than a raw
`Location` header some Next.js versions render this as a 200 with an
embedded redirect payload — confirm by opening `http://localhost:3000/admin`
in a browser instead: it should redirect to the login page, and logging in
with the test password should reach the channels page and successfully
add/remove a channel.

- [ ] **Step 5: Confirm persistence across a restart**

Add a channel via the UI, then run:

```bash
docker restart epg-admin-test
```

Wait for it to come back up, then check `http://localhost:3000/admin/channels`
again — the channel added before the restart should still be listed,
confirming the `/epg/public` volume is working.

- [ ] **Step 6: Clean up the local test container**

```bash
docker rm -f epg-admin-test
docker volume rm epg-test-public epg-test-data
```

---

### Task 14: Push the branch

**Files:** none

- [ ] **Step 1: Push `feature/admin-website` to GitHub**

```bash
git push -u origin feature/admin-website
```

- [ ] **Step 2: Confirm with the user before opening a PR or deploying**

This branch changes the `Dockerfile` and `pm2.config.js` of a service
currently serving production traffic on `epg.austheim.app`. Do not open a
PR, merge, or point the Coolify app at this branch without explicit
confirmation — the two new Coolify volumes (`/epg/public`, `/epg/data`)
must be created and `ADMIN_PASSWORD_HASH` / `SESSION_SECRET` set as Coolify
environment variables *before* switching the live deployment over, or the
container will fail closed (channels/session routes throwing on missing
env vars) or lose data (missing volumes).

---

## What's next (Plan 2, written separately after this ships)

- On-demand fetch: `lib/jobs.ts` (SQLite job history in `/epg/data/jobs.db`,
  child-process spawning, per-region lock shared with the pm2 cron jobs via
  `flock` in a modified `scripts/grab-with-history.sh`), fetch API routes,
  live SSE log streaming, and the jobs list/detail UI.
- Dashboard updates to show per-region last-run status and fetch buttons.
- README update documenting `/admin`, password setup, and the two required
  Coolify volumes.
