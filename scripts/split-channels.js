'use strict'

const fs = require('fs')
const path = require('path')

const INPUT = path.resolve(__dirname, '..', 'public', 'channels.xml')
const PUBLIC = path.resolve(__dirname, '..', 'public')

const NORDIC_LANGS = new Set(['no', 'nb', 'sv', 'fi', 'da'])

const UK_SITES = new Set([
  'sky.com',
  'freeview.co.uk',
  'mytelly.co.uk',
  'tv24.co.uk',
  'virgintvgo.virginmedia.com',
  'entertainment.ie',
  'player.ee.co.uk',
  'bbc.co.uk',
  'itv.com',
  'channel4.com',
  'channel5.com',
  'itvx.com',
  'schedules.tv'
])

const SG_SITES = new Set(['mewatch.sg', 'singtel.com', 'starhubtvplus.com'])

function classify(lang, site, siteId) {
  if (lang === 'th') return 'th'
  if (NORDIC_LANGS.has(lang)) return 'no'
  if (siteId.startsWith('UK1#') || siteId.startsWith('IE1#')) return 'uk'
  if (UK_SITES.has(site) || site.endsWith('.co.uk') || site.endsWith('.ie')) return 'uk'
  if (SG_SITES.has(site) || site.endsWith('.sg')) return 'sg'
  return 'us'
}

function makeXml(lines) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<channels>\n${lines.join('\n')}\n</channels>\n`
}

if (!fs.existsSync(INPUT)) {
  console.error(`Not found: ${INPUT}`)
  console.error('Place your channels.xml in the public/ directory first.')
  process.exit(1)
}

const buckets = { th: [], no: [], uk: [], sg: [], us: [] }

for (const line of fs.readFileSync(INPUT, 'utf8').split('\n')) {
  if (!line.trim().startsWith('<channel ')) continue
  const lang = (line.match(/\slang="([^"]*)"/) || [])[1] || ''
  const site = (line.match(/\ssite="([^"]*)"/) || [])[1] || ''
  const siteId = (line.match(/\ssite_id="([^"]*)"/) || [])[1] || ''
  buckets[classify(lang, site, siteId)].push(line)
}

for (const name of Object.keys(buckets)) {
  fs.mkdirSync(path.join(PUBLIC, name), { recursive: true })
}

for (const [key, lines] of Object.entries(buckets)) {
  const out = path.join(PUBLIC, `channels-${key}.xml`)
  fs.writeFileSync(out, makeXml(lines))
  console.log(`channels-${key}.xml  →  ${lines.length} channels`)
}
