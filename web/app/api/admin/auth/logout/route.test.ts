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
