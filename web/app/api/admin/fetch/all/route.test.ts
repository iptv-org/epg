// web/app/api/admin/fetch/all/route.test.ts
//
// Proves the fix for a live-reproduced bug: a second concurrent
// `POST /api/admin/fetch/all` request used to race into its own
// runAllSequentially() loop, which could interleave with the first loop and
// run two *different* regions in parallel (e.g. `no` from call A and `uk`
// from call B at the same time) — defeating the "fetch all runs regions
// strictly in sequence" guarantee. The fix adds a module-level
// fetchAllRunning flag (in @/lib/jobLock) that the route checks-and-sets
// synchronously before doing any async work, so a second concurrent call
// fails fast with 409 instead of starting a second loop.
import type { NextRequest } from 'next/server'
import { isFetchAllRunning, unlockFetchAll } from '@/lib/jobLock'

const execFileSyncMock = jest.fn()
jest.mock('child_process', () => ({
  execFileSync: (...args: unknown[]) => execFileSyncMock(...args)
}))

jest.mock('@/lib/session', () => ({
  isAuthorized: () => true
}))

const startJobAndWaitMock = jest.fn()
jest.mock('@/lib/jobRunner', () => ({
  startJobAndWait: (...args: unknown[]) => startJobAndWaitMock(...args)
}))

import { POST } from './route'

// isAuthorized is mocked to always return true, so the request object
// passed to POST is never inspected — a bare cast is enough and avoids
// constructing a real NextRequest/Request.
const fakeRequest = {} as NextRequest

describe('POST /api/admin/fetch/all concurrency guard', () => {
  afterEach(() => {
    unlockFetchAll()
    startJobAndWaitMock.mockReset()
    execFileSyncMock.mockReset()
  })

  it('rejects a second concurrent call with 409 while the first is still running', async () => {
    // Never resolves, so the first call's background runAllSequentially()
    // loop is still "in flight" when the second call arrives.
    startJobAndWaitMock.mockImplementation(() => new Promise(() => {}))

    const first = await POST(fakeRequest)
    expect(first.status).toBe(202)
    expect(isFetchAllRunning()).toBe(true)

    const second = await POST(fakeRequest)
    expect(second.status).toBe(409)
    const secondBody = await second.json()
    expect(secondBody.error).toMatch(/already running/i)

    // Only the first call's loop ever ran: it should have been invoked once
    // per un-locked region reached before the never-resolving await blocked
    // it (just 'th', the first region), never twice for the same region.
    expect(startJobAndWaitMock).toHaveBeenCalledTimes(1)
  })

  it('clears the flag once the sequential run finishes, so a later call can proceed', async () => {
    startJobAndWaitMock.mockResolvedValue({
      ok: true,
      job: { id: 'x', region: 'th', status: 'success', startedAt: '', finishedAt: '', exitCode: 0 }
    })

    const first = await POST(fakeRequest)
    expect(first.status).toBe(202)

    // Let the fire-and-forget runAllSequentially() promise chain (including
    // its .finally(unlockFetchAll)) settle.
    await new Promise(resolve => setImmediate(resolve))
    expect(isFetchAllRunning()).toBe(false)

    const second = await POST(fakeRequest)
    expect(second.status).toBe(202)
  })

  it('clears the flag even when the sequential run fails, so it never gets stuck locked', async () => {
    startJobAndWaitMock.mockRejectedValue(new Error('boom'))

    const first = await POST(fakeRequest)
    expect(first.status).toBe(202)

    await new Promise(resolve => setImmediate(resolve))
    expect(isFetchAllRunning()).toBe(false)

    const second = await POST(fakeRequest)
    expect(second.status).toBe(202)
  })

  it('clears the flag if the synchronous build-channels step throws, rather than leaving it stuck locked', async () => {
    execFileSyncMock.mockImplementation(() => {
      throw new Error('build-channels failed')
    })

    await expect(POST(fakeRequest)).rejects.toThrow('build-channels failed')
    expect(isFetchAllRunning()).toBe(false)

    execFileSyncMock.mockImplementation(() => undefined)
    startJobAndWaitMock.mockImplementation(() => new Promise(() => {}))
    const second = await POST(fakeRequest)
    expect(second.status).toBe(202)
  })
})
