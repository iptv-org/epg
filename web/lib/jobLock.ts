const lockedRegions = new Set<string>()

export function isRegionLocked(region: string): boolean {
  return lockedRegions.has(region)
}

export function lockRegion(region: string): void {
  lockedRegions.add(region)
}

export function unlockRegion(region: string): void {
  lockedRegions.delete(region)
}
