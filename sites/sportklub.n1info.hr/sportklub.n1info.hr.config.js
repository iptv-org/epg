const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

// Sport Klub (sportklub.n1info.hr) — the public web page renders its schedule with a
// United Cloud "chameleon-epg" widget that talks to United Group's public EPG API
// (the same backend behind EON). We hit that API directly:
//   1. POST /oauth/token?grant_type=client_credentials  (fixed public Basic creds → Bearer)
//   2. GET  /v1/public/events/epg?cid=&fromTime=&toTime=&communityIdentifier=&languageId=
// The Basic creds + communityIdentifier ('sk_hr') + languageId (181 = hr) are exactly
// what the widget on sportklub.n1info.hr uses (window.portalConfig.identifier = 'sk_hr').
const SITE = 'sportklub.n1info.hr'
const API = 'https://api-web.ug-be.cdn.united.cloud'
const IMAGE_BASE = 'https://images-web.ug-be.cdn.united.cloud'
const BASIC =
  'Basic MjdlMTFmNWUtODhlMi00OGU0LWJkNDItOGUxNWFiYmM2NmY1OjEyejJzMXJ3bXdhZmsxMGNkdzl0cjloOWFjYjZwdjJoZDhscXZ0aGc='
const COMMUNITY = 'sk_hr'
const LANGUAGE_ID = 181 // hr
const TZ = 'Europe/Zagreb'

// One public token serves every request in a grab; fetch it once and share the promise.
let tokenPromise = null
function getToken() {
  if (!tokenPromise) {
    tokenPromise = axios
      .post(`${API}/oauth/token?grant_type=client_credentials`, null, { headers: { Authorization: BASIC } })
      .then(r => r.data.access_token)
      .catch(err => {
        tokenPromise = null // let the next request retry
        throw err
      })
  }
  return tokenPromise
}

// `date` arrives as a UTC-midnight dayjs; map it to the matching Zagreb calendar day
// so day boundaries line up with how the channel actually schedules programmes.
function dayWindow(date) {
  const start = dayjs.tz(dayjs.utc(date).format('YYYY-MM-DD'), TZ).startOf('day')
  return { from: start.valueOf(), to: start.add(1, 'day').valueOf() - 1 }
}

module.exports = {
  site: SITE,
  days: 7,
  lang: 'hr',
  request: {
    headers() {
      return getToken().then(token => ({
        Authorization: `Bearer ${token}`,
        'X-UCP-TIME-FORMAT': 'timestamp',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      }))
    },
    cache: {
      ttl: 60 * 60 * 1000 // 1h
    }
  },
  url({ channel, date }) {
    const { from, to } = dayWindow(date)
    const qs = new URLSearchParams({
      cid: String(channel.site_id),
      fromTime: String(from),
      toTime: String(to),
      communityIdentifier: COMMUNITY,
      languageId: String(LANGUAGE_ID)
    })
    return `${API}/v1/public/events/epg?${qs.toString()}`
  },
  parser({ content, channel, date }) {
    let data
    try {
      data = JSON.parse(content)
    } catch {
      return []
    }
    const events = data[channel.site_id] || data[String(channel.site_id)] || []
    const { from, to } = dayWindow(date)
    // Keep only events that actually START within this day. Out-of-range day windows make
    // the API ignore the time filter and dump stale events from other dates — bounding both
    // sides drops those and guarantees each event lands on exactly one day (no duplicates).
    return events
      .filter(e => e && e.startTime != null && e.endTime != null && e.startTime >= from && e.startTime <= to)
      .map(e => ({
        title: e.title || e.originalTitle || 'Sport Klub',
        description: e.shortDescription || null,
        start: e.startTime,
        stop: e.endTime,
        image:
          e.images && e.images[0] && e.images[0].path ? `${IMAGE_BASE}${e.images[0].path}` : null
      }))
  },
  async channels() {
    const token = await getToken()
    const { data } = await axios.get(`${API}/v2/public/channels`, {
      params: { imageSize: 'S', communityIdentifier: COMMUNITY, languageId: LANGUAGE_ID },
      headers: { Authorization: `Bearer ${token}`, 'X-UCP-TIME-FORMAT': 'timestamp' }
    })
    const list = Array.isArray(data) ? data : data.channels || []
    return list.map(c => ({
      lang: 'hr',
      site_id: String(c.id),
      name: cleanName(c.name)
    }))
  }
}

// "SK 1 HD (HR)" → "Sport Klub 1"; "SK Golf (BIH/SI)" → "Sport Klub Golf".
function cleanName(name) {
  const raw = String(name || '').trim()
  const num = /^SK\s+(\d+)(?=\s|$)/i.exec(raw) // whole-number only, so "SK 4K" isn't read as "4"
  if (num) return `Sport Klub ${num[1]}`
  const rest = /^SK\s+(.+)$/i.exec(raw)
  if (rest) {
    const tail = rest[1]
      .replace(/\((?:HR|HRV|Portals?|Portal|BIH\/SI|SI|BIH)\)/gi, '')
      .replace(/\bHD\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
    return `Sport Klub ${tail}`
  }
  return raw
}
