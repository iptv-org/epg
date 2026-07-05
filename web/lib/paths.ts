import path from 'path'

function repoRoot(): string {
  return path.resolve(process.cwd(), '..')
}

export function publicDir(): string {
  return process.env.EPG_PUBLIC_DIR || path.join(repoRoot(), 'public')
}

export function dataDir(): string {
  return process.env.EPG_DATA_DIR || path.join(repoRoot(), 'data')
}

export function sitesDir(): string {
  return process.env.EPG_SITES_DIR || path.join(repoRoot(), 'sites')
}

export function channelsSourcesDir(): string {
  return process.env.EPG_CHANNELS_SOURCES_DIR || path.join(repoRoot(), 'channels-sources')
}

export function channelsXmlPath(): string {
  return path.join(publicDir(), 'channels.xml')
}

export function jobsDir(): string {
  return path.join(dataDir(), 'jobs')
}

export function locksDir(): string {
  return path.join(dataDir(), 'locks')
}
