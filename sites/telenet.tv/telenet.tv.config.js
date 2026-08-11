const axios = require('axios')
const dayjs = require('dayjs')
const doFetch = require('@ntlab/sfetch')

const API_STATIC_ENDPOINT = 'https://staticqbr-prod-be.gnp.cloud.telenet.tv/eng/web/epg-service-lite/be'
const API_PROD_ENDPOINT = 'https://spark-prod-be.gnp.cloud.telenet.tv/eng/web/linear-service/v2'
const API_IMAGE_ENDPOINT = 'https://staticqbr-prod-be.gnp.cloud.telenet.tv/image-service'

// a segment holds 6 hours of guide for every channel at once, so it is kept around
// and shared between all the channels of the same day
const segments = {}

module.exports = {
  site: 'telenet.tv',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url: function ({ date, channel, segment = 0 }) {
    return `${API_STATIC_ENDPOINT}/${channel.lang}/events/segments/${date.format(
      'YYYYMMDD'
    )}${segment.toString().padStart(2, '0')}0000`
  },
  async parser({ content, channel, date }) {
    const items = await loadItems({ content, channel, date })
    if (!items.length) return []

    const details = await loadProgramDetails(items, channel)

    return items.map((item, index) => {
      const detail = details[index] || {}

      return {
        title: item.title,
        subTitle: detail.episodeName || item.seriesName,
        icon: parseIcon(item),
        description: detail.longDescription || detail.shortDescription,
        category: detail.genres,
        actors: detail.actors,
        directors: detail.directors,
        producers: detail.producers,
        season: parseSeason(detail),
        episode: parseEpisode(detail),
        date: parseYear(detail),
        country: detail.countryOfOrigin,
        rating: parseRating(detail, item),
        language: parseLanguages(detail, item),
        subtitles: parseSubtitles(detail, item),
        new: Boolean(detail.premiere || item.premiere),
        start: parseStart(item),
        stop: parseStop(item)
      }
    })
  },
  async channels() {
    const data = await axios
      .get(`${API_PROD_ENDPOINT}/channels?cityId=28001&language=en&productClass=Orion-DASH`)
      .then(r => r.data)
      .catch(console.log)

    return data.map(item => {
      return {
        lang: 'nl',
        site_id: item.id,
        name: item.name
      }
    })
  }
}

async function loadItems({ content, channel, date }) {
  const urls = [0, 6, 12, 18].map(segment => module.exports.url({ date, channel, segment }))

  // the first segment has already been downloaded by the grabber itself
  cacheSegment(urls[0], content)

  const missing = urls.filter(url => segments[url] === undefined)
  if (missing.length) {
    await doFetch(missing, (url, res) => cacheSegment(url, res))
  }

  const items = urls.flatMap(url => findEvents(segments[url], channel))

  // an event that spans a segment boundary is listed in both segments
  return uniqueItems(items)
}

// `res` is left out when a request fails, but only when sfetch is checking results, which is a
// setting shared with the other sites using it, so every program is built from its event first
async function loadProgramDetails(items, channel) {
  const details = []
  const queues = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.id)
    .map(({ item, index }) => ({
      url: `${API_PROD_ENDPOINT}/replayEvent/${item.id}?returnLinearContent=true&language=${channel.lang}`,
      index
    }))

  if (queues.length) {
    await doFetch(queues, (queue, res) => {
      if (res) details[queue.index] = res
    })
  }

  return details
}

function cacheSegment(url, content) {
  if (segments[url] !== undefined) return
  const entries = parseEntries(content)
  // a failed download must not be cached, the next channel gets to retry it
  if (entries.length) segments[url] = entries
}

// the grabber hands over the raw response, while axios has already parsed the ones fetched here
function parseEntries(content) {
  if (!content) return []
  try {
    const data = Array.isArray(content.entries) ? content : JSON.parse(content)

    return Array.isArray(data.entries) ? data.entries : []
  } catch (err) {
    console.error(`Unable to parse guide: ${err.message}!`)

    return []
  }
}

function parseStart(item) {
  return dayjs.unix(item.startTime)
}

function parseStop(item) {
  return dayjs.unix(item.endTime)
}

function findEvents(entries, channel) {
  if (!Array.isArray(entries)) return []
  const channelData = entries.find(e => e.channelId === channel.site_id)
  if (!channelData) return []

  return Array.isArray(channelData.events) ? channelData.events : []
}

function uniqueItems(items) {
  const seen = new Set()

  return items.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)

    return true
  })
}

function parseSeason(detail) {
  if (!detail.seasonNumber) return null
  if (String(detail.seasonNumber).length > 2) return null
  return detail.seasonNumber
}

function parseEpisode(detail) {
  if (!detail.episodeNumber) return null
  if (String(detail.episodeNumber).length > 3) return null
  return detail.episodeNumber
}

function parseYear(detail) {
  if (!detail.productionDate) return null
  if (!/^\d{4}$/.test(String(detail.productionDate))) return null
  return detail.productionDate
}

// the minimum age follows the Kijkwijzer (NICAM) classification
function parseRating(detail, item) {
  const minimumAge = detail.minimumAge != null ? detail.minimumAge : item.minimumAge
  if (minimumAge == null || minimumAge === '') {
    if (detail.isAdult || item.isAdult) return { system: 'Kijkwijzer', value: '18' }
    return null
  }
  return { system: 'Kijkwijzer', value: String(minimumAge) }
}

function parseLanguages(detail, item) {
  return parseLangCodes(detail.audioLanguages || item.audioLanguages)
}

function parseSubtitles(detail, item) {
  const captions = parseLangCodes(detail.captionLanguages || item.captionLanguages)
  const signed = parseLangCodes(detail.signLanguages || item.signLanguages)

  return [
    ...captions.map(language => ({ language })),
    ...signed.map(language => ({ type: 'deaf-signed', language }))
  ]
}

// the same language can be listed more than once, once per purpose (e.g. audio description)
function parseLangCodes(languages) {
  if (!Array.isArray(languages)) return []
  return [...new Set(languages.map(language => language.lang).filter(Boolean))]
}

function parseIcon(item) {
  return `${API_IMAGE_ENDPOINT}/intent/${item.id}/posterTile`
}
