interface Attempt {
  count: number
  firstAttemptAt: number
}

const attempts = new Map<string, Attempt>()

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

export function isLockedOut(key: string, now: number = Date.now()): boolean {
  const attempt = attempts.get(key)
  if (!attempt) return false
  if (now - attempt.firstAttemptAt > WINDOW_MS) {
    attempts.delete(key)
    return false
  }
  return attempt.count >= MAX_ATTEMPTS
}

export function recordFailedAttempt(key: string, now: number = Date.now()): void {
  const attempt = attempts.get(key)
  if (!attempt || now - attempt.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: now })
    return
  }
  attempt.count += 1
}

export function clearAttempts(key: string): void {
  attempts.delete(key)
}
