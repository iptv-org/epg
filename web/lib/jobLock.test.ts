import { isRegionLocked, lockRegion, unlockRegion } from '@/lib/jobLock'

describe('jobLock', () => {
  afterEach(() => {
    unlockRegion('th')
  })

  it('is not locked initially', () => {
    expect(isRegionLocked('th')).toBe(false)
  })

  it('lockRegion marks a region as locked', () => {
    lockRegion('th')
    expect(isRegionLocked('th')).toBe(true)
  })

  it('unlockRegion clears the lock', () => {
    lockRegion('th')
    unlockRegion('th')
    expect(isRegionLocked('th')).toBe(false)
  })

  it('locking one region does not affect another', () => {
    lockRegion('th')
    expect(isRegionLocked('no')).toBe(false)
  })
})
