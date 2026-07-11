# Admin Nav & Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the admin website a shared layout with real navigation (nav bar + logout) across all four authenticated pages, replacing today's bare, unstyled, disconnected pages — with zero change to any page's functional behavior.

**Architecture:** Move the four authenticated pages (dashboard, channels, jobs, job detail) into a Next.js route group `app/admin/(app)/` with a single `layout.tsx` that centralizes the `requireSession()` call (removing it from each page) and renders a new client-component `NavBar` above the page content. The pre-existing but never-wired-up logout route gets fixed (it currently returns JSON instead of redirecting — dead code, zero callers) and covered by its first test, then the nav's logout control uses it as a plain HTML form (no JavaScript required for logout itself; only the nav's active-link highlighting needs a client boundary, via `usePathname()`). Styling is a plain CSS extension of the existing `globals.css` — no new dependency.

**Tech Stack:** Same as the rest of the app — Next.js 15 App Router, TypeScript, Jest (`@swc/jest`), plain CSS. No new npm packages.

## Global Constraints

- No new npm dependencies (no CSS framework, no component library) — extend `web/app/globals.css` in place.
- No URL changes — `/admin`, `/admin/channels`, `/admin/jobs`, `/admin/jobs/:id` must resolve exactly as they do today (Next.js route groups — a parenthesized folder segment — never appear in the URL, so this holds automatically as long as files move into `(app)/` without other path changes).
- No functional changes to Channels, Jobs, or Job Detail page behavior — only shared chrome (nav) and CSS polish.
- `web/app/admin/login/page.tsx` stays outside the `(app)` route group and must never render the nav bar (nothing to navigate to before authentication).
- Full existing Jest suite (52 tests / 9 suites as of the `feature/admin-jobs` branch this work is based on) must stay green after every task; `npm run build` must stay clean after every task.

---

### Task 1: Route group restructure + centralized session check

**Files:**
- Create: `web/app/admin/(app)/layout.tsx`
- Move: `web/app/admin/page.tsx` → `web/app/admin/(app)/page.tsx`
- Move: `web/app/admin/channels/page.tsx` → `web/app/admin/(app)/channels/page.tsx`
- Move: `web/app/admin/channels/ChannelsClient.tsx` → `web/app/admin/(app)/channels/ChannelsClient.tsx`
- Move: `web/app/admin/jobs/page.tsx` → `web/app/admin/(app)/jobs/page.tsx`
- Move: `web/app/admin/jobs/JobsClient.tsx` → `web/app/admin/(app)/jobs/JobsClient.tsx`
- Move: `web/app/admin/jobs/[id]/page.tsx` → `web/app/admin/(app)/jobs/[id]/page.tsx`
- Move: `web/app/admin/jobs/[id]/JobDetailClient.tsx` → `web/app/admin/(app)/jobs/[id]/JobDetailClient.tsx`

**Interfaces:**
- Consumes: `requireSession` from `@/lib/session` (unchanged signature: `(): Promise<void>`, redirects to `/admin/login` internally on failure)
- Produces: `web/app/admin/(app)/layout.tsx` default-exports a Next.js layout component; later tasks (Task 3) will import and render `NavBar` from a sibling file inside this same directory

This task only moves files and centralizes the existing `requireSession()` call — no nav bar yet (that's Task 3), so after this task the four pages look exactly as they do today, just routed through a shared layout.

- [ ] **Step 1: Move the four pages and their client components into the route group**

```bash
mkdir -p "web/app/admin/(app)"
git mv web/app/admin/page.tsx "web/app/admin/(app)/page.tsx"
git mv web/app/admin/channels "web/app/admin/(app)/channels"
git mv web/app/admin/jobs "web/app/admin/(app)/jobs"
```

- [ ] **Step 2: Remove the per-page `requireSession()` calls now that the layout will own it**

Edit `web/app/admin/(app)/page.tsx` to:

```tsx
import Link from 'next/link'

export default function AdminDashboard() {
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

Edit `web/app/admin/(app)/channels/page.tsx` to:

```tsx
// web/app/admin/(app)/channels/page.tsx
import ChannelsClient from './ChannelsClient'

export default function ChannelsPage() {
  return <ChannelsClient />
}
```

Edit `web/app/admin/(app)/jobs/page.tsx` to:

```tsx
// web/app/admin/(app)/jobs/page.tsx
import JobsClient from './JobsClient'

export default function JobsPage() {
  return <JobsClient />
}
```

Edit `web/app/admin/(app)/jobs/[id]/page.tsx` to:

```tsx
// web/app/admin/(app)/jobs/[id]/page.tsx
import JobDetailClient from './JobDetailClient'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <JobDetailClient id={id} />
}
```

(`ChannelsClient.tsx`, `JobsClient.tsx`, and `JobDetailClient.tsx` themselves are untouched — only the `page.tsx` wrappers change.)

- [ ] **Step 3: Create the shared layout**

```tsx
// web/app/admin/(app)/layout.tsx
import { ReactNode } from 'react'
import { requireSession } from '@/lib/session'

export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  await requireSession()
  return <>{children}</>
}
```

- [ ] **Step 4: Run the full test suite and build to confirm nothing broke**

```bash
cd web
npm test
npm run build
```

Expected: all 52 existing tests still pass, build compiles with no errors, and the route manifest in the build output still lists `/admin`, `/admin/channels`, `/admin/jobs`, `/admin/jobs/[id]` (confirming the route group didn't change any URL).

- [ ] **Step 5: Manually verify no regression**

Start the dev server (`npm run dev` in `web/`), log in at `http://localhost:3001/admin/login`, then visit `/admin`, `/admin/channels`, and `/admin/jobs` in turn. Expected: all three render exactly as before (no nav bar yet — that's Task 3), no console errors, no redirect loops.

- [ ] **Step 6: Commit**

```bash
git add web/app/admin
git commit -m "restructure admin pages into a route group with centralized session check"
```

---

### Task 2: Fix and test the existing (unused) logout route

**Files:**
- Modify: `web/app/api/admin/auth/logout/route.ts`
- Create: `web/app/api/admin/auth/logout/route.test.ts`

**Interfaces:**
- Consumes: `SESSION_COOKIE` from `@/lib/session`
- Produces: `POST /api/admin/auth/logout` — now redirects to `/admin/login` with a `303` status and clears the session cookie (previously returned `{ok: true}` JSON with no redirect; this route exists in the codebase already from an earlier plan but has zero callers anywhere in the app, confirmed by grep — changing its response shape is safe)

This task exists because a `logout` route was built in an earlier plan but never wired to any UI control, and its current JSON-response behavior won't work as a plain HTML form target (Task 3's nav bar needs a form that redirects on submit, so JavaScript is not required for logging out). Fixing it here, before Task 3 depends on it, keeps Task 3 focused purely on the nav bar itself.

- [ ] **Step 1: Write the failing test**

```ts
// web/app/api/admin/auth/logout/route.test.ts
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'
import { POST } from './route'

function fakeRequest(): NextRequest {
  return { url: 'http://localhost:3001/api/admin/auth/logout' } as NextRequest
}

describe('POST /api/admin/auth/logout', () => {
  it('redirects to /admin/login', async () => {
    const response = await POST(fakeRequest())
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('http://localhost:3001/admin/login')
  })

  it('clears the session cookie', async () => {
    const response = await POST(fakeRequest())
    const cookie = response.cookies.get(SESSION_COOKIE)
    expect(cookie?.value).toBe('')
    expect(cookie?.maxAge).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx jest app/api/admin/auth/logout -v`

Expected: FAIL — the first test fails because the current implementation returns a `200` JSON response, not a `303` redirect (`expect(response.status).toBe(303)` receives `200`).

- [ ] **Step 3: Fix the implementation**

```ts
// web/app/api/admin/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/admin/login', request.url), 303)
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx jest app/api/admin/auth/logout -v`

Expected: PASS — both tests green.

- [ ] **Step 5: Run the full suite to confirm no regression elsewhere**

```bash
cd web
npm test
npm run build
```

Expected: 54 tests passing (52 existing + 2 new), build clean.

- [ ] **Step 6: Commit**

```bash
git add web/app/api/admin/auth/logout
git commit -m "fix logout route to redirect instead of returning JSON, add its first test"
```

---

### Task 3: NavBar component with active-link highlighting and logout

**Files:**
- Create: `web/app/admin/(app)/NavBar.tsx`
- Modify: `web/app/admin/(app)/layout.tsx`
- Modify: `web/app/globals.css` (append nav-specific styles only — Task 4 handles the broader page styling)

**Interfaces:**
- Consumes: `usePathname` from `next/navigation`; `Link` from `next/link`; the fixed `POST /api/admin/auth/logout` from Task 2
- Produces: default export `NavBar` (no props), rendered by `web/app/admin/(app)/layout.tsx`

- [ ] **Step 1: Create the NavBar component**

```tsx
// web/app/admin/(app)/NavBar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/channels', label: 'Channels' },
  { href: '/admin/jobs', label: 'Jobs' }
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="admin-nav">
      <span className="admin-nav-title">EPG Admin</span>
      <div className="admin-nav-links">
        {LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={isActive(pathname, link.href) ? 'admin-nav-link active' : 'admin-nav-link'}
          >
            {link.label}
          </Link>
        ))}
        <form method="POST" action="/api/admin/auth/logout" className="admin-nav-logout-form">
          <button type="submit" className="admin-nav-logout">
            Log out
          </button>
        </form>
      </div>
    </nav>
  )
}
```

Note: the logout control is a plain HTML form posting directly to the route fixed in Task 2 — no `onClick`/`fetch` handler, so logging out works even with JavaScript disabled. The only reason this component needs `'use client'` at all is `usePathname()` for the active-link highlight; that's a cosmetic-only concern, so if JavaScript is unavailable the links and logout still work, just without the highlight.

- [ ] **Step 2: Wire NavBar into the layout**

```tsx
// web/app/admin/(app)/layout.tsx
import { ReactNode } from 'react'
import { requireSession } from '@/lib/session'
import NavBar from './NavBar'

export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  await requireSession()
  return (
    <>
      <NavBar />
      {children}
    </>
  )
}
```

- [ ] **Step 3: Add nav-specific styles**

Append to `web/app/globals.css`:

```css
.admin-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 2rem;
  border-bottom: 1px solid #8884;
}

.admin-nav-title {
  font-weight: 600;
}

.admin-nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.admin-nav-link {
  color: inherit;
  opacity: 0.7;
  text-decoration: none;
}

.admin-nav-link.active {
  opacity: 1;
  font-weight: 600;
}

.admin-nav-link:hover {
  opacity: 1;
}

.admin-nav-logout-form {
  margin: 0;
}
```

- [ ] **Step 4: Run the full test suite and build**

```bash
cd web
npm test
npm run build
```

Expected: 54 tests passing, build clean.

- [ ] **Step 5: Manually verify**

With the dev server running, log in and visit `/admin`, `/admin/channels`, `/admin/jobs`. Expected: a nav bar with "EPG Admin", three links, and a "Log out" button appears at the top of all three; the link matching the current page is visually distinct (bold/full opacity) while the others are dimmed; clicking "Log out" clears the session and lands you back on `/admin/login`; visiting `/admin/login` directly (logged out) shows no nav bar.

- [ ] **Step 6: Commit**

```bash
git add "web/app/admin/(app)/NavBar.tsx" "web/app/admin/(app)/layout.tsx" web/app/globals.css
git commit -m "add nav bar with active-link highlighting and logout"
```

---

### Task 4: Styling polish — color scheme and existing element styles

**Files:**
- Modify: `web/app/globals.css`

**Interfaces:**
- None — pure CSS, no component changes.

- [ ] **Step 1: Replace the body/table/input/button rules with a small color-scheme-aware polish pass**

Edit `web/app/globals.css` — replace the existing `body`, `table`, `th, td`, and `input, button` rules (leave the `:root`, `.admin-nav*`, and `.error` rules from earlier tasks untouched) with:

```css
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  line-height: 1.5;
}

main {
  padding: 2rem;
  max-width: 960px;
  margin: 0 auto;
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
  border: 1px solid #8886;
  border-radius: 0.375rem;
  background: transparent;
  color: inherit;
}

button {
  cursor: pointer;
}

button:hover {
  border-color: #8888;
}
```

(Moving `padding: 2rem` from `body` to `main` matters because the nav bar sits inside `<body>` but outside each page's `<main>` — without this change the nav bar would inherit the same 2rem inset as the page content instead of spanning edge-to-edge. The `/admin/login` page also renders a `<main>`, so it keeps the same padding it had before, unaffected by this change.)

- [ ] **Step 2: Run the full test suite and build**

```bash
cd web
npm test
npm run build
```

Expected: 54 tests passing, build clean (this task touches no `.ts`/`.tsx` files, so this step is a safety check, not an expected-failure scenario).

- [ ] **Step 3: Manually verify**

With the dev server running, visit each of `/admin`, `/admin/channels`, `/admin/jobs`, and a job's detail page. Expected: the nav bar spans the full width above a nicely inset page body; tables, inputs, and buttons look consistent across all pages; switching your OS/browser to dark mode changes the page background/text via the existing `color-scheme: light dark` declaration with no visual breakage.

- [ ] **Step 4: Commit**

```bash
git add web/app/globals.css
git commit -m "polish shared table/input/button styles and page layout spacing"
```

---

### Task 5: Final manual verification across the whole feature

**Files:** none (verification only)

- [ ] **Step 1: Full walkthrough**

With the dev server running (or deployed to the same Coolify target used for the prior admin-jobs work, if you want to verify in production conditions):

1. Visit `/admin` while logged out — confirm you land on `/admin/login` with no nav bar.
2. Log in — confirm you land on `/admin` with the nav bar visible, "Dashboard" highlighted as active.
3. Click "Channels" — confirm the URL is `/admin/channels`, "Channels" is now highlighted, page content unchanged from before this plan.
4. Click "Jobs" — confirm the URL is `/admin/jobs`, "Jobs" is now highlighted, page content unchanged.
5. Click into a job's detail page — confirm the nav bar is still present (job detail is inside the same route group) and still shows "Jobs" as the active link (job detail has no nav entry of its own).
6. Click "Log out" — confirm you're returned to `/admin/login` and the session cookie is gone (a subsequent visit to `/admin` redirects back to login).
7. Confirm no browser console errors on any of the above pages.

- [ ] **Step 2: Confirm final test/build state**

```bash
cd web
npm test
npm run build
```

Expected: 54/54 tests passing, build clean, route manifest unchanged (`/admin`, `/admin/channels`, `/admin/jobs`, `/admin/jobs/[id]`, plus the existing API routes).
