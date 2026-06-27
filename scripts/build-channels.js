'use strict'

const fs = require('fs')
const path = require('path')

const FORK = path.resolve(__dirname, '..')
const SOURCES = path.join('C:', 'Users', 'tausthei', 'ClaudeCode')
const OUTPUT = path.join('C:', 'Users', 'tausthei', 'ClaudeCode')

// Read a channels.xml file and return an array of channel objects.
// opts.lang        — default lang attribute when not present in file
// opts.isWebGrab   — strips update= attr, clears xmltv_id, keeps site_id as-is
// opts.fixOntvtonight — rewrites ##N/slug → us#N/slug
function readChannels(filePath, opts = {}) {
  const { lang: defaultLang = 'en', isWebGrab = false, fixOntvtonight = false } = opts
  let content
  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch {
    console.warn(`  SKIP (not found): ${filePath}`)
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

function makeXml(channels, comment) {
  const seen = new Set()
  const lines = []
  for (const ch of channels) {
    const key = `${ch.site}|${ch.siteId}`
    if (seen.has(key)) continue
    seen.add(key)
    lines.push(`  <channel site="${ch.site}" site_id="${ch.siteId}" lang="${ch.lang}" xmltv_id="${ch.xmltvId}">${ch.name}</channel>`)
  }
  const header = comment ? `  <!-- ${comment} -->\n` : ''
  return `<?xml version="1.0" encoding="UTF-8"?>\n<channels>\n${header}${lines.join('\n')}\n</channels>\n`
}

function write(filename, channels, comment) {
  const xml = makeXml(channels, comment)
  const outPath = path.join(OUTPUT, filename)
  fs.writeFileSync(outPath, xml)
  const count = (xml.match(/<channel /g) || []).length
  console.log(`${filename}: ${count} channels  →  ${outPath}`)
}

// ── Norway ────────────────────────────────────────────────────────────────────
// allente.no: iptv-org version (WebGrab+ site_ids are different)
// rikstv.no:  WebGrab+ version has more channels and site_ids match iptv-org
const norway = [
  ...readChannels(path.join(FORK, 'sites/allente.no/allente.no_no.channels.xml')),
  ...readChannels(path.join(SOURCES, 'Norway/rikstv.no.channels.xml'),
    { lang: 'no', isWebGrab: true }),
]
write('channels-no.xml', norway, 'Sources: allente.no (iptv-org), rikstv.no (WebGrab+)')

// ── UK ────────────────────────────────────────────────────────────────────────
// WebGrab+ sky.com/freeview/mytelly use different site_id formats — use iptv-org files
const uk = [
  ...readChannels(path.join(FORK, 'sites/sky.com/sky.com.channels.xml')),
  ...readChannels(path.join(FORK, 'sites/freeview.co.uk/freeview.co.uk.channels.xml')),
  ...readChannels(path.join(FORK, 'sites/mytelly.co.uk/mytelly.co.uk.channels.xml')),
]
write('channels-uk.xml', uk, 'Sources: sky.com, freeview.co.uk, mytelly.co.uk (all iptv-org)')

// ── USA ───────────────────────────────────────────────────────────────────────
// ontvtonight: WebGrab+ ## prefix → us# prefix (site_ids otherwise identical)
// tvtv.us/xumo.tv: WebGrab+ uses different ID format — use iptv-org files
const usa = [
  ...readChannels(
    path.join(SOURCES, 'USA/ontvtonight.com.channels.10001-Satellite - DirecTV New York.xml'),
    { lang: 'en', isWebGrab: true, fixOntvtonight: true }),
  ...readChannels(path.join(FORK, 'sites/tvtv.us/tvtv.us.channels.xml')),
  ...readChannels(path.join(FORK, 'sites/xumo.tv/xumo.tv.channels.xml')),
]
write('channels-us.xml', usa, 'Sources: ontvtonight.com (WebGrab+→converted), tvtv.us, xumo.tv (iptv-org)')

// ── Thailand ──────────────────────────────────────────────────────────────────
// gigatv: use iptv-org file (has @SD xmltv_ids — strip those so they match NBTC ids)
// tv.trueid.net: iptv-org file
const gigaRaw = readChannels(path.join(FORK, 'sites/gigatv.3bbtv.co.th/gigatv.3bbtv.co.th.channels.xml'))
const giga = gigaRaw.map(ch => ({ ...ch, xmltvId: ch.xmltvId.replace(/@SD$/, '') }))
const trueid = readChannels(path.join(FORK, 'sites/tv.trueid.net/tv.trueid.net_th.channels.xml'))
const thailand = [...giga, ...trueid]
write('channels-th.xml', thailand, 'Sources: gigatv.3bbtv.co.th, tv.trueid.net (iptv-org)')
