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
