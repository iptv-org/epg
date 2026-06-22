const axios = require('axios')

// Iskon TV (Hrvatski Telekom brand) — public EPG, no auth.
// One JSON file per day holds EVERY channel's programmes, so url() returns a
// single per-date URL and epg-grabber's request cache fetches it once and shares
// it across all mapped channels. The parser just filters that day by channelUuid.
const SITE = 'iskon.hr'
const BASE = 'https://iskon.hr'
const IMAGE_BASE = `${BASE}/public/epg/images`

// Parse each day's 4 MB file at most once per grab (parser runs per channel).
const dayCache = {}

function parseDay(content) {
  if (dayCache[content] !== undefined) return dayCache[content]
  let arr
  try {
    arr = JSON.parse(content)
  } catch {
    arr = []
  }
  if (!Array.isArray(arr)) arr = []
  dayCache[content] = arr
  return arr
}

module.exports = {
  site: SITE,
  days: 3,
  url({ date }) {
    return `${BASE}/api/epg/programs_${date.format('YYYY_MM_DD')}.json`
  },
  request: {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      referer: `${BASE}/televizija/tv-vodic`,
      accept: 'application/json'
    },
    cache: {
      ttl: 6 * 60 * 60 * 1000 // 6h — the whole day file is shared across channels
    }
  },
  parser({ content, channel }) {
    const all = parseDay(content)
    const wanted = String(channel.site_id)
    return all
      .filter(p => String(p.channelUuid) === wanted)
      .map(p => ({
        title: p.title,
        description: p.description || null,
        categories: p.genre && p.genre.trim() ? [p.genre.trim()] : [],
        date: p.year ? String(p.year) : null,
        image: p.image ? `${IMAGE_BASE}/${p.image}` : null,
        start: p.since,
        stop: p.till
      }))
  },
  async channels() {
    const data = await axios
      .get(`${BASE}/public/epg/channels.json`, { headers: module.exports.request.headers })
      .then(r => r.data)
      .catch(console.error)

    return (data || [])
      .filter(c => !c.type || c.type === 'channel')
      .map(c => ({
        lang: 'hr',
        name: c.title,
        site_id: String(c.uuid)
      }))
  }
}
