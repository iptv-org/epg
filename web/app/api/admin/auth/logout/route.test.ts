import type { NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'
import { POST } from './route'

// Live-reproduced bug: behind Caddy's reverse_proxy, request.url reflects
// the internal 127.0.0.1:3001 origin, not the public origin the browser
// actually used, so redirecting via `new URL('/admin/login', request.url)`
// sent the browser to http://localhost:3001/admin/login in production. The
// fix reads X-Forwarded-Proto/X-Forwarded-Host (set by Caddy) when present,
// falling back to request.url's own origin otherwise (local dev via
// `next dev`, with no proxy in front). A real Headers instance is used so
// request.headers.get(...) behaves correctly.
function fakeRequest(headers: Record<string, string> = {}): NextRequest {
  return {
    url: 'http://localhost:3001/api/admin/auth/logout',
    headers: new Headers(headers)
  } as NextRequest
}

describe('POST /api/admin/auth/logout', () => {
  it('redirects using x-forwarded-proto/x-forwarded-host when present (behind Caddy)', async () => {
    const response = await POST(
      fakeRequest({
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'epg.austheim.app'
      })
    )
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://epg.austheim.app/admin/login')
  })

  it('falls back to request.url\'s own origin when no forwarded headers are present (local dev)', async () => {
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
