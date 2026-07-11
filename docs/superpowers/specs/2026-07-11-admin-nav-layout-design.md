# Admin Site Navigation & Layout Design

**Goal:** Give the admin website (currently four bare, unstyled pages with no shared chrome) a real layout with consistent navigation, styling, and a logout action — without changing the functional behavior of any existing page.

**Context:** The admin site (`web/app/admin/`) has four pages today: dashboard (`page.tsx`), channels (`channels/page.tsx`), jobs list (`jobs/page.tsx`), and job detail (`jobs/[id]/page.tsx`), plus a login page (`login/page.tsx`). Each of the four authenticated pages independently calls `await requireSession()` and renders a bare `<main>` with an `<h1>` and raw HTML elements — no shared header, no navigation between pages, no logout, and only a handful of untargeted CSS rules in `globals.css`. This is the first of three planned enhancement sub-projects (nav/layout, then channel management upgrade, then README) — this spec covers only the first.

**Tech stack:** Same as the rest of the app — Next.js App Router, TypeScript, plain CSS (no new dependency). No new npm packages.

## Architecture

**Route grouping.** Introduce a route group `app/admin/(app)/` containing the four currently-authenticated pages (dashboard, channels, jobs, jobs/[id]), each moved into the group without changing their URL (route groups — parenthesized segments — don't appear in the URL path, so `/admin`, `/admin/channels`, `/admin/jobs`, `/admin/jobs/:id` are unaffected). `app/admin/login/page.tsx` stays outside the group.

A single `app/admin/(app)/layout.tsx`:
- Calls `await requireSession()` once, replacing the per-page calls currently duplicated across all four pages.
- Renders the nav bar, then `{children}`.

This removes the `requireSession()` duplication as a targeted cleanup alongside the new layout — the four page components stop importing/calling it themselves.

**Nav bar component.** New `web/app/admin/(app)/NavBar.tsx`. Next.js App Router has no stable server-only way to read the current pathname without middleware, so this is a small client component (`'use client'`) using `usePathname()` purely to highlight the active link — the same kind of narrow, justified client boundary already used elsewhere in this app (`ChannelsClient`, `JobsClient`, `JobDetailClient`). Renders: site title ("EPG Admin"), links to Dashboard (`/admin`), Channels (`/admin/channels`), Jobs (`/admin/jobs`) with the current one visually distinct, and a logout control as a bare `<form method="POST" action="/api/admin/auth/logout">` with a submit button. Every link and the logout form are plain HTML elements that work with JavaScript disabled — the client boundary only affects the cosmetic active-link highlight, nothing functional.

**Logout route (new).** `web/app/api/admin/auth/logout/route.ts` — `POST` handler that clears the `epg_admin_session` cookie (`cookies().delete(SESSION_COOKIE)` or setting it expired) and returns a redirect (`NextResponse.redirect(new URL('/admin/login', request.url))`). No auth check needed on this route itself (logging out an already-logged-out session is a harmless no-op).

**Styling.** Extend `web/app/globals.css` in place — no new dependency, no CSS-in-JS, no Tailwind. Add: a small spacing/color scale (respecting the existing `color-scheme: light dark` so system dark mode keeps working), nav bar layout (horizontal bar, title left, links + logout right, active link visually distinct), and tidied-up table/form/button styles that the existing pages already partially use (`th`/`td`, `input`/`button`, `.error`) so the four content pages inherit a more finished look without changing their markup structure beyond what's needed to fit the new shared chrome.

## Testing

- New route test `web/app/api/admin/auth/logout/route.test.ts` (mirrors the existing `fetch/all/route.test.ts` pattern: mock `next/headers` cookies, assert the session cookie is cleared and the response redirects to `/admin/login`).
- No component-level tests for `NavBar`/`layout.tsx` — this repo has no React component test infrastructure (no testing-library/jsdom), consistent with how prior UI-only tasks in this project were verified (build + manual browser check) rather than adding new test tooling for this one styling-focused change.
- Full existing Jest suite must stay green; `npm run build` must stay clean.
- Manual verification: log in, confirm nav appears on all four pages with correct active-link highlighting, confirm logout clears the session and redirects to login, confirm login page itself has no nav.

## Non-goals

- No functional changes to Channels, Jobs, or Job Detail page content/behavior — only their surrounding chrome and incidental styling polish.
- No new npm dependencies (no Tailwind, no component library) — plain CSS only, per explicit choice.
- Channel edit-in-place and the explicit region field (items 2+3 of the original enhancement list) are a separate sub-project, designed and built after this one.
- README/screenshots (item 4) are a separate sub-project, done last, after the UI from this and the next sub-project has settled.
