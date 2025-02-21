const doFetch = require('@ntlab/sfetch')
const axios = require('axios')
const dayjs = require('dayjs')
const _ = require('lodash')
const crypto = require('crypto')

// API Configuration Constants
const NATCO_CODE = 'hr'
const APP_LANGUAGE = 'hr'
const APP_KEY = 'GWaBW4RTloLwpUgYVzOiW5zUxFLmoMj5'
const APP_VERSION = '02.0.1080'
const NATCO_KEY = 'l2lyvGVbUm2EKJE96ImQgcc8PKMZWtbE'
const SITE_URL = 'mojmaxtv.hrvatskitelekom.hr'

// Role Types
const ROLE_TYPES = {
  ACTOR: 'GLUMI',      // Croatian for "ACTS"
  DIRECTOR: 'REŽIJA',  // Croatian for "DIRECTOR"
  PRODUCER: 'PRODUKCIJA', // Croatian for "PRODUCER"
  WRITER: 'AUTOR',
  SCENARIO: 'SCENARIJ'
}

// Dynamic API Endpoint based on NATCO_CODE
const API_ENDPOINT = `https://tv-${NATCO_CODE}-prod.yo-digital.com/${NATCO_CODE}-bifrost`

// Session/Device IDs
const DEVICE_ID = crypto.randomUUID()
const SESSION_ID = crypto.randomUUID()

const cached = {}

const getHeaders = () => ({
  'app_key': APP_KEY,
  'app_version': APP_VERSION,
  'device-id': DEVICE_ID,
  'tenant': 'tv',
  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  'origin': `https://${SITE_URL}`,
  'x-request-session-id': SESSION_ID,
  'x-request-tracking-id': crypto.randomUUID(),
  'x-tv-step': 'EPG_SCHEDULES',
  'x-tv-flow': 'EPG',
  'x-call-type': 'GUEST_USER',
  'x-user-agent': `web|web|Chrome-133|${APP_VERSION}|1`
})

module.exports = {
  site: SITE_URL,
  url({ date }) {
    return `${API_ENDPOINT}/epg/channel/schedules?date=${date.format(
      'YYYY-MM-DD'
    )}&hour_offset=0&hour_range=3&channelMap_id&filler=true&app_language=${APP_LANGUAGE}&natco_code=${NATCO_CODE}`
  },
  request: {
    headers: getHeaders(),
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  async parser({ content, channel, date }) {
    const data = parseData(content)
    if (!data) return []

    let items = parseItems(data, channel)
    if (!items.length) return []

    const queue = [3, 6, 9, 12, 15, 18, 21]
      .map(offset => {
        const url = module.exports.url({ date }).replace('hour_offset=0', `hour_offset=${offset}`)
        const params = { ...module.exports.request, headers: getHeaders() }

        if (cached[url]) {
          items = items.concat(parseItems(cached[url], channel))
          return null
        }

        return { url, params }
      })
      .filter(Boolean)

    await doFetch(queue, (_req, _data) => {
      if (_data) {
        cached[_req.url] = _data
        items = items.concat(parseItems(_data, channel))
      }
    })

    items = _.sortBy(items, i => dayjs(i.start_time).valueOf())

    // Fetch program details for each item
    const programs = []
    for (let item of items) {
      const detail = await loadProgramDetails(item)

//      detectUnknownRoles(detail)

      programs.push({
        title: item.description,
        sub_title: item.episode_name,
        description: parseDescription(detail),
        categories: Array.isArray(item.genres) ? item.genres.map(g => g.name) : [],
        date: parseDate(item),
        image: detail.poster_image_url,
        actors: parseRoles(detail, ROLE_TYPES.ACTOR),
        directors: parseRoles(detail, ROLE_TYPES.DIRECTOR),
        producers: parseRoles(detail, ROLE_TYPES.PRODUCER),
        season: parseSeason(item),
        episode: parseEpisode(item),
        rating: parseRating(item),
        start: item.start_time,
        stop: item.end_time
      })
    }

    return programs
  },
  async channels() {
    const data = await axios
      .get(
        `${API_ENDPOINT}/epg/channel?channelMap_id=&includeVirtualChannels=false&natco_key=${NATCO_KEY}&app_language=${APP_LANGUAGE}&natco_code=${NATCO_CODE}`,
        { ...module.exports.request, headers: getHeaders() }
      )
      .then(r => r.data)
      .catch(console.error)

    return data.channels.map(channel => ({
      lang: NATCO_CODE,
      name: channel.title,
      site_id: channel.station_id
    }))
  }
}

async function loadProgramDetails(item) {
  if (!item.program_id) return {}
  const url = `${API_ENDPOINT}/details/series/${item.program_id}?natco_code=${NATCO_CODE}`
  const data = await axios
    .get(url, { headers: getHeaders() })
    .then(r => r.data)
    .catch(console.log)

  return data || {}
}

function parseData(content) {
  try {
    const data = JSON.parse(content)
    return data || null
  } catch {
    return null
  }
}

function parseItems(data, channel) {
  if (!data.channels || !Array.isArray(data.channels[channel.site_id])) return []
  return data.channels[channel.site_id]
}

function parseDate(item) {
  return item && item.release_year ? item.release_year.toString() : null
}

function parseRating(item) {
  return item.ratings
    ? {
        system: 'MPA',
        value: item.ratings
      }
    : null
}

function parseSeason(item) {
  if (item.season_display_number === 'Epizode') return null // 'Epizode' is 'Episodes' in Croatian
  return item.season_number
}

function parseEpisode(item) {
  if (item.episode_number) return parseInt(item.episode_number)
  if (item.season_display_number === 'Epizode') return item.season_number
  return null
}

function parseDescription(item) {
  if (!item.details) return null
  return item.details.description
}

function parseRoles(item, role_name) {
  if (!item.roles) return null
  return item.roles.filter(role => role.role_name === role_name).map(role => role.person_name)
}
