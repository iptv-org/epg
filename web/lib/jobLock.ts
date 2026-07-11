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

// Guards against two concurrent "fetch all" runs. Per-region locks (above)
// only stop the same region from running twice; they do nothing to stop two
// overlapping runAllSequentially() loops from interleaving into a parallel
// execution of *different* regions (e.g. call A reaches 'no' and locks it
// just before call B's loop checks 'no', so B moves on and locks 'uk'
// instead). This flag makes a second concurrent "fetch all" request fail
// fast instead of racing into a second sequential loop.
let fetchAllRunning = false

export function isFetchAllRunning(): boolean {
  return fetchAllRunning
}

export function lockFetchAll(): void {
  fetchAllRunning = true
}

export function unlockFetchAll(): void {
  fetchAllRunning = false
}
