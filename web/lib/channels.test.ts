import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  Channel,
  parseChannelsXml,
  serializeChannelsXml,
  readChannels,
  writeChannels,
  addChannel,
  removeChannel
} from '@/lib/channels'

describe('channels xml parsing', () => {
  it('parses well-formed channel lines', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<channels>\n  <channel site="example.com" site_id="CH1" lang="en" xmltv_id="Example.us">Example Channel</channel>\n</channels>\n`
    const channels = parseChannelsXml(xml)
    expect(channels).toEqual<Channel[]>([
      { site: 'example.com', siteId: 'CH1', lang: 'en', xmltvId: 'Example.us', name: 'Example Channel' }
    ])
  })

  it('skips lines missing required attributes', () => {
    const xml = `<channels>\n  <channel site="" site_id="CH1" lang="en">No Site</channel>\n</channels>`
    expect(parseChannelsXml(xml)).toEqual([])
  })

  it('round-trips through serialize + parse, escaping special characters', () => {
    const channels: Channel[] = [
      { site: 'a&b.com', siteId: 'CH<1>', lang: 'en', xmltvId: '', name: 'Rock & "Roll"' }
    ]
    const xml = serializeChannelsXml(channels)
    expect(parseChannelsXml(xml)).toEqual(channels)
  })
})

describe('channels file storage', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epg-channels-test-'))
    process.env.EPG_PUBLIC_DIR = tmpDir
  })

  afterEach(() => {
    delete process.env.EPG_PUBLIC_DIR
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('readChannels returns an empty array when the file does not exist', () => {
    expect(readChannels()).toEqual([])
  })

  it('writeChannels then readChannels round-trips', () => {
    const channels: Channel[] = [
      { site: 'example.com', siteId: 'CH1', lang: 'en', xmltvId: '', name: 'Example' }
    ]
    writeChannels(channels)
    expect(readChannels()).toEqual(channels)
  })

  it('addChannel appends a new channel', () => {
    const result = addChannel({ site: 'a.com', siteId: 'A1', lang: 'en', xmltvId: '', name: 'A' })
    expect(result).toEqual({ ok: true })
    expect(readChannels()).toEqual([{ site: 'a.com', siteId: 'A1', lang: 'en', xmltvId: '', name: 'A' }])
  })

  it('addChannel rejects a duplicate site+siteId', () => {
    addChannel({ site: 'a.com', siteId: 'A1', lang: 'en', xmltvId: '', name: 'A' })
    const result = addChannel({ site: 'a.com', siteId: 'A1', lang: 'en', xmltvId: '', name: 'A dup' })
    expect(result).toEqual({ ok: false, error: 'duplicate' })
    expect(readChannels()).toHaveLength(1)
  })

  it('removeChannel removes a matching channel', () => {
    addChannel({ site: 'a.com', siteId: 'A1', lang: 'en', xmltvId: '', name: 'A' })
    const result = removeChannel('a.com', 'A1')
    expect(result).toEqual({ ok: true })
    expect(readChannels()).toEqual([])
  })

  it('removeChannel returns not_found when there is no match', () => {
    const result = removeChannel('missing.com', 'X')
    expect(result).toEqual({ ok: false, error: 'not_found' })
  })
})
