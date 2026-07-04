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
