import fs from 'fs'
import os from 'os'
import path from 'path'
import { buildCatalogIndex, searchCatalog, CatalogEntry } from '@/lib/catalog'

describe('catalog index', () => {
  let tmpRoot: string

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'epg-catalog-test-'))
    const sitesDir = path.join(tmpRoot, 'sites')
    const sourcesDir = path.join(tmpRoot, 'channels-sources')
    fs.mkdirSync(path.join(sitesDir, 'example.com'), { recursive: true })
    fs.mkdirSync(sourcesDir, { recursive: true })

    fs.writeFileSync(
      path.join(sitesDir, 'example.com', 'example.com.channels.xml'),
      `<channels>\n  <channel site="example.com" site_id="CH1" lang="en" xmltv_id="Example.us">Example One</channel>\n</channels>`
    )
    fs.writeFileSync(
      path.join(sourcesDir, 'extra.channels.xml'),
      `<channels>\n  <channel site="extra.com" site_id="EX1" lang="en" xmltv_id="">Extra Sports</channel>\n</channels>`
    )

    process.env.EPG_SITES_DIR = sitesDir
    process.env.EPG_CHANNELS_SOURCES_DIR = sourcesDir
  })

  afterEach(() => {
    delete process.env.EPG_SITES_DIR
    delete process.env.EPG_CHANNELS_SOURCES_DIR
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  })

  it('indexes channels from both sites/ subfolders and channels-sources/', () => {
    const index = buildCatalogIndex()
    expect(index).toHaveLength(2)
    expect(index.map(e => e.name).sort()).toEqual(['Example One', 'Extra Sports'])
  })

  it('searchCatalog matches by name or site, case-insensitively', () => {
    const index: CatalogEntry[] = [
      { site: 'example.com', siteId: 'CH1', lang: 'en', xmltvId: '', name: 'Example One' },
      { site: 'extra.com', siteId: 'EX1', lang: 'en', xmltvId: '', name: 'Extra Sports' }
    ]
    expect(searchCatalog(index, 'sport').map(e => e.name)).toEqual(['Extra Sports'])
    expect(searchCatalog(index, 'EXAMPLE').map(e => e.name)).toEqual(['Example One'])
    expect(searchCatalog(index, 'extra.com').map(e => e.name)).toEqual(['Extra Sports'])
  })

  it('searchCatalog returns an empty array for a blank query', () => {
    expect(searchCatalog([{ site: 'a', siteId: 'b', lang: 'en', xmltvId: '', name: 'c' }], '   ')).toEqual([])
  })
})
