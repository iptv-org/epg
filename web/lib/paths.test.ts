import path from 'path'
import {
  publicDir,
  dataDir,
  sitesDir,
  channelsSourcesDir,
  channelsXmlPath,
  jobsDir,
  locksDir
} from '@/lib/paths'

describe('paths', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('uses env var overrides when set', () => {
    process.env.EPG_PUBLIC_DIR = '/tmp/fake-public'
    process.env.EPG_DATA_DIR = '/tmp/fake-data'
    process.env.EPG_SITES_DIR = '/tmp/fake-sites'
    process.env.EPG_CHANNELS_SOURCES_DIR = '/tmp/fake-sources'

    expect(publicDir()).toBe('/tmp/fake-public')
    expect(dataDir()).toBe('/tmp/fake-data')
    expect(sitesDir()).toBe('/tmp/fake-sites')
    expect(channelsSourcesDir()).toBe('/tmp/fake-sources')
    expect(channelsXmlPath()).toBe(path.join('/tmp/fake-public', 'channels.xml'))
    expect(jobsDir()).toBe(path.join('/tmp/fake-data', 'jobs'))
    expect(locksDir()).toBe(path.join('/tmp/fake-data', 'locks'))
  })

  it('falls back to repo-relative defaults when env vars are unset', () => {
    delete process.env.EPG_PUBLIC_DIR
    const expected = path.resolve(process.cwd(), '..', 'public')
    expect(publicDir()).toBe(expected)
  })
})
