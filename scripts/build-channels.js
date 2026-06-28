'use strict'

const fs = require('fs')
const path = require('path')

const FORK    = path.resolve(__dirname, '..')
const PUBLIC  = path.join(FORK, 'public')
const CSRC    = path.join(FORK, 'channels-sources')

// ── Classification (same rules as split-channels.js) ─────────────────────────

const NORDIC_LANGS = new Set(['no', 'nb', 'sv', 'fi', 'da'])
const UK_SITES     = new Set([
  'sky.com', 'freeview.co.uk', 'mytelly.co.uk', 'tv24.co.uk',
  'virgintvgo.virginmedia.com', 'entertainment.ie', 'player.ee.co.uk',
  'bbc.co.uk', 'itv.com', 'channel4.com', 'channel5.com', 'itvx.com', 'schedules.tv'
])

function classify(lang, site, siteId) {
  if (lang === 'th') return 'th'
  if (NORDIC_LANGS.has(lang)) return 'no'
  if (siteId.startsWith('UK1#') || siteId.startsWith('IE1#')) return 'uk'
  if (UK_SITES.has(site) || site.endsWith('.co.uk') || site.endsWith('.ie')) return 'uk'
  return 'us'
}

// ── Channel file reader ───────────────────────────────────────────────────────

function readChannels(filePath, opts = {}) {
  const { defaultLang = 'en', isWebGrab = false, fixOntvtonight = false } = opts
  let content
  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch {
    console.warn(`  skip (not found): ${path.basename(filePath)}`)
    return []
  }

  const channels = []
  for (const line of content.split('\n')) {
    if (!line.trim().startsWith('<channel ')) continue

    const site    = (line.match(/\bsite="([^"]*)"/)    || [])[1] || ''
    let   siteId  = (line.match(/\bsite_id="([^"]*)"/) || [])[1] || ''
    const lang    = (line.match(/\blang="([^"]*)"/)    || [])[1] || defaultLang
    const xmltvId = isWebGrab ? '' : ((line.match(/\bxmltv_id="([^"]*)"/) || [])[1] || '')
    const name    = (line.match(/>([^<]+)<\/channel>/) || [])[1]?.trim() || ''

    if (!site || !siteId || !name) continue
    if (fixOntvtonight) siteId = siteId.replace(/^##/, 'us#')

    channels.push({ site, siteId, lang, xmltvId, name })
  }
  return channels
}

// ── XML writer ────────────────────────────────────────────────────────────────

function writeRegion(region, channels) {
  const seen = new Set()
  const lines = []
  for (const ch of channels) {
    const key = `${ch.site}|${ch.siteId}`
    if (seen.has(key)) continue
    seen.add(key)
    lines.push(`  <channel site="${ch.site}" site_id="${ch.siteId}" lang="${ch.lang}" xmltv_id="${ch.xmltvId}">${ch.name}</channel>`)
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<channels>\n${lines.join('\n')}\n</channels>\n`
  fs.mkdirSync(path.join(PUBLIC, region), { recursive: true })
  fs.writeFileSync(path.join(PUBLIC, `channels-${region}.xml`), xml)
  console.log(`channels-${region}.xml: ${lines.length} channels`)
}

// ── Build buckets ─────────────────────────────────────────────────────────────

const buckets = { th: [], no: [], uk: [], us: [] }

// 1. Split user's public/channels.xml by region (same as split-channels.js)
const masterPath = path.join(PUBLIC, 'channels.xml')
if (fs.existsSync(masterPath)) {
  for (const line of fs.readFileSync(masterPath, 'utf8').split('\n')) {
    if (!line.trim().startsWith('<channel ')) continue
    const lang   = (line.match(/\blang="([^"]*)"/)    || [])[1] || ''
    const site   = (line.match(/\bsite="([^"]*)"/)    || [])[1] || ''
    const siteId = (line.match(/\bsite_id="([^"]*)"/) || [])[1] || ''
    const region = classify(lang, site, siteId)
    buckets[region].push({ site, siteId, lang,
      xmltvId: (line.match(/\bxmltv_id="([^"]*)"/) || [])[1] || '',
      name: (line.match(/>([^<]+)<\/channel>/) || [])[1]?.trim() || ''
    })
  }
}

// 2. Add iptv-org + channels-sources channels per region

// Norway
buckets.no.push(
  ...readChannels(path.join(FORK, 'sites/allente.no/allente.no_no.channels.xml')),
  ...readChannels(path.join(CSRC, 'rikstv.no.channels.xml'), { defaultLang: 'no', isWebGrab: true })
)

// UK
buckets.uk.push(
  ...readChannels(path.join(FORK, 'sites/sky.com/sky.com.channels.xml')),
  ...readChannels(path.join(FORK, 'sites/freeview.co.uk/freeview.co.uk.channels.xml')),
  ...readChannels(path.join(FORK, 'sites/mytelly.co.uk/mytelly.co.uk.channels.xml'))
)

// International / US
buckets.us.push(
  ...readChannels(path.join(CSRC, 'ontvtonight-directv-ny.channels.xml'),
    { defaultLang: 'en', isWebGrab: true, fixOntvtonight: true }),
  ...readChannels(path.join(FORK, 'sites/tvtv.us/tvtv.us.channels.xml')),
  ...readChannels(path.join(FORK, 'sites/xumo.tv/xumo.tv.channels.xml'))
)

// Thailand — strip @SD suffix from gigatv xmltv_ids so they match the NBTC ids
const gigaChannels = readChannels(
  path.join(FORK, 'sites/gigatv.3bbtv.co.th/gigatv.3bbtv.co.th.channels.xml')
).map(ch => ({ ...ch, xmltvId: ch.xmltvId.replace(/@SD$/, '') }))

buckets.th.push(
  ...gigaChannels,
  ...readChannels(path.join(FORK, 'sites/tv.trueid.net/tv.trueid.net_th.channels.xml'))
)

// 3. Write
for (const [region, channels] of Object.entries(buckets)) {
  writeRegion(region, channels)
}
