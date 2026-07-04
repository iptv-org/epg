import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSessionToken } from '@/lib/auth'
import { isLockedOut, recordFailedAttempt, clearAttempts } from '@/lib/rateLimit'
import { SESSION_COOKIE } from '@/lib/session'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

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
