const axios = require('axios')
const crypto = require('crypto')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const MANIFEST_URL = 'https://prod.dcm.telekom-dienste.de/v1/settings/web-mtv/manifest'
const DEVICE_MODEL = 'WEB2_FTV'
const PORTAL = 'release'
const SUBSCRIBER_TYPE = 'FTV_FREEMIUM_DT'
const CHANNEL_PAGE_SIZE = 100
const CHANNEL_PAGE_LIMIT = 1000

const FALLBACK_MPX = Object.freeze({
  accountPid: 'mdeprod',
  locationIdUri: 'http://data.entertainment.tv.theplatform.eu/entertainment/data/Location/245991976396',
  feeds: {
    allChannelSchedulesFeed:
      'https://feed.entertainment.tv.theplatform.eu/f/{MpxAccountPid}/{MpxAccountPid}-all-channel-schedules',
    allChannelStationsFeed:
      'https://feed.entertainment.tv.theplatform.eu/f/{MpxAccountPid}/{MpxAccountPid}-channel-stations-main'
  }
})

let session
let manifestPromise

module.exports = {
  site: 'www.magenta.tv',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  async url({ channel, date }) {
    const mpx = await getMpxConfig()
    const currentSession = getSession()
    const window = getUtcWindow(date)

    return buildScheduleUrl({
      mpx,
      session: currentSession,
      siteIds: [channel.site_id],
      window
    })
  },
  async parser({ content, channel }) {
    return parseScheduleResponse(content, channel)
  },
  async channels() {
    const mpx = await getMpxConfig()
    const currentSession = getSession()
    const channels = []

    for (let start = 1; start <= CHANNEL_PAGE_LIMIT; start += CHANNEL_PAGE_SIZE) {
      const entries = await getChannelEntries({
        mpx,
        session: currentSession,
        start,
        end: start + CHANNEL_PAGE_SIZE - 1
      })

      if (!entries.length) break

      entries.forEach(entry => {
        const channel = parseChannel(entry)
        if (channel) channels.push(channel)
      })

      if (entries.length < CHANNEL_PAGE_SIZE) break
    }

    return channels
  }
}

function createSession() {
  return {
    deviceId: crypto.randomUUID(),
    sessionId: crypto.randomUUID()
  }
}

function getSession() {
  if (!session) {
    session = createSession()
  }

  return session
}

function buildCid(currentSession) {
  return `${currentSession.sessionId}::${crypto.randomUUID()}`
}

function getManifestRequestConfig(currentSession) {
  return {
    headers: {
      'X-DT-Call-ID': crypto.randomUUID(),
      'X-DT-Session-ID': currentSession.sessionId
    },
    params: {
      deviceId: currentSession.deviceId,
      deviceModel: DEVICE_MODEL,
      portal: PORTAL,
      subscriberType: SUBSCRIBER_TYPE,
      $redirect: false,
      sid: currentSession.sessionId
    }
  }
}

async function getManifest() {
  if (!manifestPromise) {
    manifestPromise = axios
      .get(MANIFEST_URL, getManifestRequestConfig(getSession()))
      .then(r => r.data)
      .catch(() => null)
  }

  return manifestPromise
}

async function getMpxConfig() {
  const manifest = await getManifest()
  const manifestMpx = manifest && manifest.mpx ? manifest.mpx : {}

  return {
    ...FALLBACK_MPX,
    ...manifestMpx,
    feeds: {
      ...FALLBACK_MPX.feeds,
      ...(manifestMpx.feeds || {})
    }
  }
}

async function getChannelEntries({ mpx, session, start, end }) {
  const url = buildChannelFeedUrl({ mpx, session, start, end })
  const data = await axios
    .get(url)
    .then(r => r.data)
    .catch(() => null)

  return Array.isArray(data && data.entries) ? data.entries : []
}

function buildChannelFeedUrl({ mpx, session, start, end }) {
  const url = new URL(resolveFeedTemplate(mpx.feeds.allChannelStationsFeed, mpx.accountPid))

  url.searchParams.set('lang', 'short-de')
  url.searchParams.set('sort', 'dt$displayChannelNumber')
  url.searchParams.set('range', `${start}-${end}`)
  url.searchParams.set('cid', buildCid(session))

  return url.toString()
}

function buildScheduleUrl({ mpx, session, siteIds, window }) {
  const url = new URL(resolveFeedTemplate(mpx.feeds.allChannelSchedulesFeed, mpx.accountPid))

  url.searchParams.set('byId', siteIds.join('|'))
  url.searchParams.set('byListingTime', window)
  url.searchParams.set('byLocationId', mpx.locationIdUri)
  url.searchParams.set('cid', buildCid(session))

  return url.toString()
}

function resolveFeedTemplate(template, accountPid) {
  return template.replaceAll('{MpxAccountPid}', accountPid)
}

function getUtcWindow(date) {
  const start = date.utc().startOf('day')
  const end = start.add(1, 'day')

  return `${start.toISOString()}~${end.toISOString()}`
}

function parseScheduleResponse(content, channel) {
  const data = parseJson(content)
  const entries = Array.isArray(data && data.entries) ? data.entries : []
  const targetSiteId = channel && channel.site_id ? String(channel.site_id) : null
  const programs = []

  entries.forEach(entry => {
    if (targetSiteId && extractNumericId(entry.id) !== targetSiteId) return
    if (!Array.isArray(entry.listings)) return

    entry.listings.forEach(listing => {
      const program = parseProgramme(entry, listing)
      if (program) programs.push(program)
    })
  })

  return programs
}

function parseChannel(entry) {
  if (!entry || entry['dt$isRadio']) return null

  const station = getFirstStation(entry)
  const siteId = extractNumericId(entry.id)
  const name = station && station.title ? station.title : entry.title

  if (!station || !siteId || !name) return null

  return {
    lang: 'de',
    site_id: siteId,
    name
  }
}

function parseProgramme(entry, listing) {
  if (
    !listing ||
    !listing.program ||
    listing.startTime === null ||
    listing.startTime === undefined ||
    listing.endTime === null ||
    listing.endTime === undefined
  ) {
    return null
  }

  const program = listing.program
  const programInfo = parseProgramInfo(listing['dt$programInfo'])
  const title = program.title

  if (!title) return null

  const parsed = {
    title,
    description: program.description || null,
    category: parseCategories(program.tags),
    sub_title: parseSubTitle(program, listing),
    rating: parseRating(program.ratings),
    season: normalizeNumber(program.tvSeasonNumber ?? programInfo.tvSeasonNumber),
    episode: normalizeNumber(
      program.tvSeasonEpisodeNumber ??
        programInfo.tvSeasonEpisodeNumber ??
        programInfo.seriesEpisodeNumber
    ),
    image: parseProgramImage(program),
    icon: parseProgramImage(program),
    start: dayjs(Number(listing.startTime)),
    stop: dayjs(Number(listing.endTime)),
    country: parseCountry(program['dt$countries']),
    date: program.year ? String(program.year) : null
  }

  if (parsed.image === null) delete parsed.image
  if (parsed.icon === null) delete parsed.icon
  if (parsed.category === null) delete parsed.category
  if (parsed.sub_title === null) delete parsed.sub_title
  if (parsed.rating === null) delete parsed.rating
  if (parsed.season === null) delete parsed.season
  if (parsed.episode === null) delete parsed.episode
  if (parsed.country === null) delete parsed.country
  if (parsed.date === null) delete parsed.date

  return parsed
}

function parseSubTitle(program, listing) {
  if (program.secondaryTitle && program.secondaryTitle !== program.title) {
    return program.secondaryTitle
  }

  if (listing['dt$seriesTitle'] && listing['dt$seriesTitle'] !== program.title) {
    return listing['dt$seriesTitle']
  }

  return null
}

function parseCategories(tags) {
  if (!Array.isArray(tags)) return null

  const categories = tags
    .filter(tag => ['category', 'genre-primary', 'genre-secondary'].includes(tag.scheme) && tag.title)
    .map(tag => tag.title)

  return categories.length ? [...new Set(categories)] : null
}

function parseRating(ratings) {
  if (!Array.isArray(ratings)) return null

  const rating = ratings.find(item => item && item.rating && item.rating !== 'UNKNOWN')
  if (!rating) return null

  return {
    system: rating.scheme || 'magenta',
    value: rating.rating
  }
}

function parseProgramInfo(value) {
  if (!value || typeof value !== 'string') return {}

  try {
    return JSON.parse(value.replaceAll("'", '"'))
  } catch {
    return {}
  }
}

function parseProgramImage(program) {
  if (!program || !program.thumbnails) return null

  const thumbnails = Object.values(program.thumbnails)
    .filter(thumbnail => thumbnail && thumbnail.url)
    .sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0))

  return thumbnails[0] ? thumbnails[0].url : null
}

function parseCountry(value) {
  if (!value || typeof value !== 'string') return null
  return value.toUpperCase()
}

function getFirstStation(entry) {
  if (!entry || !entry.stations || typeof entry.stations !== 'object') return null
  return Object.values(entry.stations)[0] || null
}

function extractNumericId(uri) {
  if (!uri || typeof uri !== 'string') return null
  const match = uri.match(/(\d+)(?!.*\d)/)
  return match ? match[1] : null
}

function normalizeNumber(value) {
  return value === null || value === undefined || value === '' ? null : value
}

function parseJson(content) {
  if (!content) return {}
  if (typeof content !== 'string') return content

  try {
    return JSON.parse(content)
  } catch {
    return {}
  }
}
