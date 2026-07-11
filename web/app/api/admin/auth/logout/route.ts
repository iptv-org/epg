import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

// Behind Caddy's reverse_proxy, request.url reflects the internal
// 127.0.0.1:3001 origin the proxy connects to, not the public origin the
// browser actually used. Caddy sets X-Forwarded-Proto/X-Forwarded-Host by
// default, so prefer those when present; fall back to request.url's own
// origin for local dev via `next dev`, where there's no proxy in front.
function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (!forwardedHost) return new URL(request.url).origin
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  return `${forwardedProto}://${forwardedHost}`
}

export async function POST(request: NextRequest) {
  const origin = getPublicOrigin(request)
  const response = NextResponse.redirect(new URL('/admin/login', origin), 303)
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
