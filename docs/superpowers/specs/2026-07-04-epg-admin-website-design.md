# EPG Admin Website — Design Spec

Date: 2026-07-04
Repo: dj1p/epg (fork of iptv-org/epg)
Status: Approved for planning

## Problem

`dj1p/epg` grabs EPG XML guides for five regions (th, no, uk, sg, us) on a cron
schedule via pm2, and serves the output as static files from `epg.austheim.app`
(e.g. `/guide.xml`, `/th/guide.xml`, `/channels-th.xml`). Channel membership is
managed today by hand-editing `public/channels.xml` and there is no way to
trigger an on-demand fetch, see job status, or view logs without shelling into
the server. We want a password-protected admin website that adds:

1. Add/remove channels (persisted, catalog search + manual entry)
2. Start an on-demand XML fetch per region (or all), with a live status/log view
3. Everything gated behind a single admin password, implemented securely

**Hard constraint:** the existing EPG XML URLs must keep working exactly as
they do today, with no gap in availability across a deploy.

## Current architecture (as found)

- Docker image built by `Dockerfile`: does a fresh `git clone` of this repo at
  **image build time** (not container start). No files under `public/` are
  committed to git (`.gitignore` excludes `/channels.xml`, `/guide.xml`, etc.)
  — `public/` does not exist in the repo at all.
- `pm2.config.js` runs, via pm2:
  - `serve` — `npx serve -- public`, the static file server (port 3000 today)
  - `grab` — legacy combined grab job on cron (`chronos`)
  - `grab-th` / `grab-no` / `grab-uk` / `grab-sg` / `grab-us` — per-region grab
    jobs on cron, each running
    `bash scripts/grab-with-history.sh --channels=public/channels-<region>.xml --output=public/<region>/guide.xml`
  - `grab-at-startup` (if `RUN_AT_STARTUP=true`) — one-shot job that runs
    `node scripts/build-channels.js` then every regional grab in sequence
- `scripts/build-channels.js`: reads `public/channels.xml` (the user-curated
  master list, if present) and splits it into `public/channels-<region>.xml`
  by classifying each `<channel>`'s `lang`/`site`. It **also** always merges in
  a fixed, hardcoded set of extra channels per region, sourced from specific
  files under `sites/*.channels.xml` and `channels-sources/*.channels.xml`
  (e.g. UK always gets `sky.com` + `freeview.co.uk` + `mytelly.co.uk`,
  regardless of the master list).
- Today there is **no persistent volume** anywhere in the deployment. Every
  container start regenerates `public/` from scratch via `grab-at-startup`.
  This means there is currently no durable master channel list in production
  at all — live channels are 100% whatever's hardcoded in `build-channels.js`.
- No web UI, API, database, or auth exists today.

## Scope decisions (from clarification)

- **Deployment**: new services run inside the **same Coolify app/container**
  as the existing grabber (not a separate service). Everything ships in this
  same repo.
- **Stack**: **Next.js** (App Router, TypeScript) — one app providing both the
  admin UI and its API routes, run as one more pm2-managed process.
- **Routing**: add **Caddy** as the container's single exposed process/port.
  `/admin*` and `/api/admin/*` → Next.js (`web`, internal port 3001).
  Everything else (all existing XML paths) → `serve`, moved to internal port
  3002. Existing external URLs are completely unchanged.
- **Persistence** (supersedes the "no volume" starting point):
  - **Coolify volume #1**, mounted at `/epg/public` — covers the *entire*
    existing `public/` directory (all served XML, and `channels.xml`, the
    master list, at its current default path). This is a genuine architecture
    change from today: `public/` becomes durable across redeploys/restarts
    instead of regenerating from empty every time. Existing files are only
    ever overwritten when a fetch actually completes, never wiped by a deploy
    with nothing yet regenerated in their place. `build-channels.js` needs no
    path changes — `public/channels.xml` is already the master-list path it
    reads.
  - **Coolify volume #2**, mounted at `/epg/data` — small, holds only
    `jobs.db` (SQLite). Deliberately kept outside `public/` so job
    history/logs (which may reference internal paths) are never reachable via
    the public static file server, independent of `/admin` auth.
- **Channel management scope**: add/remove only touches the user-curated
  master list (`public/channels.xml`). The hardcoded per-region extras baked
  into `build-channels.js` (sky.com, freeview.co.uk, rikstv.no, etc.) are left
  alone — no exclusion-list mechanism, no changes to that script's merge
  logic.
- **Channel selection UX**: search across the existing catalog
  (`sites/*.channels.xml` + `channels-sources/*.channels.xml`, indexed in
  memory by the `web` process at startup) by name/site, **plus** a manual
  entry fallback (site / site_id / lang / xmltv_id / name typed directly) for
  channels not yet in any catalog.
- **Fetch trigger & execution**: the website spawns its own child process
  running the same command `pm2.config.js` already uses per region
  (`grab-with-history.sh --channels=public/channels-<region>.xml --output=public/<region>/guide.xml`),
  independent of pm2's own cron-triggered runs. UI exposes a "fetch now"
  button per region (th/no/uk/sg/us) plus a "fetch all" that runs
  `build-channels.js` once followed by all five regions in sequence — mirrors
  `grab-at-startup`'s existing behavior.
- **Concurrency safety**: a per-region lockfile (or equivalent) is shared
  between the pm2 cron jobs and the website's on-demand spawns, so a manual
  fetch and a scheduled cron run for the same region can never execute
  concurrently and corrupt each other's output.
- **Job history/logs persistence**: SQLite (`/epg/data/jobs.db`) — one row per
  job (id, region, status, started_at, finished_at, exit_code), with captured
  stdout/stderr for the detailed log view.
- **Live log view**: Server-Sent Events (SSE) stream new log lines to the
  browser while a job is running; job history list is a normal page.
- **Auth**: single admin password only (no multi-user accounts).
  - `ADMIN_PASSWORD_HASH` (argon2id hash) and `SESSION_SECRET` set as Coolify
    environment variables, never committed to git.
  - Login verifies via `argon2.verify`, issues a signed httpOnly, `Secure`,
    `SameSite=Lax` session cookie. Stateless (no server-side session table
    needed for a single user).
  - Failed login attempts are rate-limited per IP (lockout after 5 attempts /
    15 minutes).
  - **The entire `/admin` site requires login** — there is no unauthenticated
    read-only view of channel lists, job status, or logs. Only `/admin/login`
    and its API route are reachable without a valid session.
  - Next.js middleware enforces the session check on every `/admin*` and
    `/api/admin/*` request.

## Components

New additions to the `dj1p/epg` repo:

```
epg/
  web/                        # NEW: Next.js app (TypeScript, App Router)
    app/
      admin/
        page.tsx               # dashboard: per-region status + fetch buttons
        channels/page.tsx       # list, search-and-add, remove
        jobs/page.tsx           # job history list
        jobs/[id]/page.tsx       # single job detail, live log (SSE)
        login/page.tsx
      api/admin/
        auth/login/route.ts
        auth/logout/route.ts
        channels/route.ts        # GET list / POST add / DELETE remove
        channels/search/route.ts # catalog search
        fetch/[region]/route.ts  # POST start a fetch
        jobs/route.ts             # GET job history
        jobs/[id]/stream/route.ts # GET SSE log stream
      middleware.ts             # session gate for /admin* and /api/admin/*
    lib/
      auth.ts                   # password verify, session cookie sign/verify
      channels.ts                # channels.xml read/write/dedup
      catalog.ts                 # sites/* + channels-sources/* index + search
      jobs.ts                    # job runner: spawn, lock, SQLite, SSE
    package.json
  Caddyfile                    # NEW: reverse proxy config
  Dockerfile                   # MODIFIED: installs Caddy, builds web/, adds volumes
  pm2.config.js                # MODIFIED: adds `caddy` + `web` app entries, serve → 3002
  scripts/                     # unchanged
  public/                      # unchanged paths; now volume-persistent
```

## Data flow

**Add channel**
1. UI: user searches the catalog (or fills the manual form) and submits.
2. `POST /api/admin/channels` validates input (required fields, XML-escapes
   the name, rejects a duplicate `site`+`site_id` already in the list).
3. Server appends the `<channel>` entry to `public/channels.xml`.
4. Server immediately re-runs `node scripts/build-channels.js` (fast, local,
   no network) so `public/channels-<region>.xml` reflect the new membership
   right away. Actual program data (`guide.xml`) remains whatever it was
   until a fetch runs — the UI makes this explicit ("channel added — run a
   fetch to pull its schedule").

**Remove channel**
1. `DELETE /api/admin/channels` removes the matching `<channel>` line from
   `public/channels.xml`, then re-runs `build-channels.js` the same way.

**Start fetch (single region)**
1. `POST /api/admin/fetch/:region` checks that region's lock is free (not
   held by a cron run or another manual run already in progress) — 409 if
   not.
2. Acquires the lock, creates a `jobs` row (`status=running`), spawns
   `bash scripts/grab-with-history.sh --channels=public/channels-<region>.xml --output=public/<region>/guide.xml`.
3. stdout/stderr lines are appended to the job's log and pushed over SSE to
   any open `/admin/jobs/:id` view.
4. On process exit: job row updated to `success`/`failed` + exit code, lock
   released.

**Start fetch (all)**
1. Runs `build-channels.js` once, then triggers the five per-region fetches
   in sequence (matching `grab-at-startup`'s existing order/behavior), each
   as its own job row.

**Job history / logs**
- `/admin/jobs` lists rows from `jobs.db`, newest first, with a status badge.
- `/admin/jobs/:id` shows the full captured log; if the job is still running,
  the view opens an SSE connection and appends new lines live.

## Auth flow

1. `GET /admin/*` (or `/api/admin/*`) with no/invalid session cookie →
   middleware redirects to `/admin/login` (or 401 for API calls).
2. `POST /api/admin/auth/login` with the password → `argon2.verify` against
   `ADMIN_PASSWORD_HASH`. On success, sign a session token (HMAC with
   `SESSION_SECRET`, short expiry, e.g. 12h) into an httpOnly/secure/SameSite
   cookie. On failure, increment a per-IP failure counter; once it hits 5
   within 15 minutes, reject further attempts from that IP regardless of
   password correctness until the window elapses.
3. `POST /api/admin/auth/logout` clears the cookie.
4. **Deviation from the original design (accepted during implementation):**
   no separate same-origin/CSRF header check was added to mutating routes.
   `SameSite=Lax` already prevents the session cookie from being attached to
   a cross-site POST/DELETE, which is the actual threat this point was meant
   to cover, so a redundant explicit check was judged unnecessary. Revisit
   if a future change relaxes `SameSite` or introduces a legitimate
   cross-origin caller.

## Error handling

- Invalid/duplicate channel input → 400/409 with a specific message; nothing
  is written to `channels.xml`.
- Fetch requested while the region's lock is held → 409, UI shows "already
  running" rather than double-spawning a grab.
- Grab process exits non-zero → job marked `failed`; exit code and full log
  remain visible in the job detail view.
- `/epg/data` or `/epg/public` missing/empty on first boot (e.g. brand-new
  volume) → created automatically; `channels.xml` initialized empty if
  absent.
- Login lockout responds with a generic message (no distinction between
  "wrong password" and "locked out" is required, since it's single-user).

## Testing

- Jest unit tests (matching the repo's existing `@swc/jest` setup) for:
  `channels.xml` read/write/dedup logic, catalog indexing/search, and the
  per-region lock (including the case where a manual fetch and a simulated
  cron run overlap).
- Manual verification against a local Docker build (volumes included) before
  the change touches the live Coolify service, since this modifies the
  Dockerfile/pm2 config of a production app currently serving real traffic.

## Out of scope (explicitly not building)

- Multi-user accounts / roles — single shared admin password only.
- An exclusion mechanism for the hardcoded per-region catalog extras in
  `build-channels.js` — those remain unmanaged by the website.
- Editing `build-channels.js`'s classification rules or region set from the
  UI — regions (th/no/uk/sg/us) stay fixed as defined in code.
- Git-commit-based persistence for `channels.xml` — persistence is
  volume-based only (see Scope decisions).
