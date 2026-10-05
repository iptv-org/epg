const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

// The API groups programmes into broadcast days that start at 04:00
// Europe/Helsinki. Requesting exactly that window (instead of a fixed
// UTC+2 offset) keeps the interval aligned year-round; a misaligned
// interval gets answered with a "303 See Other" to a widened window.
// Without an explicit `limit` the API paginates 20 items per response,
// so only the first ~20 programmes of each day would be returned.
const dayStart = date => dayjs.tz(date.format('YYYY-MM-DD'), 'Europe/Helsinki').add(4, 'h')

module.exports = {
  site: 'dna.fi',
  days: 2,
  url({ date, channel }) {
    const beginTimestamp = dayStart(date).valueOf()
    const endTimestamp = dayStart(date.add(1, 'd')).subtract(1, 's').valueOf()

    return `https://mts-pro-envoy-vip.dna.fi/hbx/api/pub/xrtv/g/media?q=channel:${channel.site_id}&q=profile:pr&q=start-interval:${beginTimestamp}/${endTimestamp}&limit=1000`
  },
  parser({ content }) {
    let programs = []
    let items = parseItems(content)
    items.forEach(item => {
      const data = item?._embedded?.['xrtv:meta']?.data
      if (!data?.start) return

      programs.push({
        title: data?.title,
        subtitle: data?.episode_title,
        description: data?.description,
        season: data?.season_number,
        episode: data?.episode_number,
        date: data?.year,
        categories: parseCategories(item),
        rating: parseRating(data),
        images: parseImages(item),
        directors: parseCast(data, 'director'),
        actors: parseCast(data, 'actors'),
        start: dayjs(data.start),
        stop: dayjs(data.end)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get('https://mts-pro-envoy-vip.dna.fi/hbx/api/pub/xrtv/g/media?q=profile:ch&limit=1000')
      .then(r => r.data)
      .catch(console.error)

    return data._embedded['xrtv:media-item'].map(c => {
      return {
        lang: 'fi',
        site_id: c.datalistTerm,
        name: c.name
      }
    })
  }
}

function parseCast(data, role) {
  if (!data[role] || !data[role].value) return []

  return data[role].value.split(', ').map(name => ({
    lang: data[role].lang,
    value: name
  }))
}

function parseCategories(item) {
  const categories = item?._embedded?.['xrtv:media-category']

  return Array.isArray(categories) ? categories.map(category => category.name) : []
}

function parseRating(data) {
  if (!data.age_rating) return null

  return {
    system: 'VET',
    value: data.age_rating
  }
}

function parseImages(item) {
  const images = item?._embedded?.['xrtv:image']

  return Array.isArray(images) ? images.map(image => image.src) : []
}

function parseItems(content) {
  if (!content) return []

  // Let malformed content (e.g. an HTML error page) throw, so the grab
  // is reported as an error instead of silently producing no programmes.
  const data = JSON.parse(content)
  if (!data?.page) {
    throw new Error('Unexpected response structure')
  }

  const items = data?._embedded?.['xrtv:media-item']

  return Array.isArray(items) ? items : []
}
