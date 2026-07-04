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
