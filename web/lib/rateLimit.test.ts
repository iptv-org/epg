import { isLockedOut, recordFailedAttempt, clearAttempts } from '@/lib/rateLimit'

describe('rateLimit', () => {
  const KEY = '203.0.113.5'

  afterEach(() => {
    clearAttempts(KEY)
  })

  it('is not locked out with no attempts', () => {
    expect(isLockedOut(KEY)).toBe(false)
  })

  it('locks out after 5 failed attempts within the window', () => {
    const now = 1_000_000
    for (let i = 0; i < 5; i++) recordFailedAttempt(KEY, now + i)
    expect(isLockedOut(KEY, now + 5)).toBe(true)
  })

  it('does not lock out after only 4 failed attempts', () => {
    const now = 1_000_000
    for (let i = 0; i < 4; i++) recordFailedAttempt(KEY, now + i)
    expect(isLockedOut(KEY, now + 4)).toBe(false)
  })

  it('resets the window once 15 minutes have passed', () => {
    const now = 1_000_000
    for (let i = 0; i < 5; i++) recordFailedAttempt(KEY, now + i)
    const sixteenMinutesLater = now + 16 * 60 * 1000
    expect(isLockedOut(KEY, sixteenMinutesLater)).toBe(false)
  })

  it('clearAttempts resets the counter immediately', () => {
    const now = 1_000_000
    for (let i = 0; i < 5; i++) recordFailedAttempt(KEY, now + i)
    clearAttempts(KEY)
    expect(isLockedOut(KEY, now + 5)).toBe(false)
  })
})
