const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'dna.fi',
  days: 2,
  url({ date, channel }) {
    const beginTimestamp = date.add(2, 'h').valueOf()
    const endTimestamp = date.add(1, 'd').add(2, 'h').subtract(1, 's').valueOf()

    return `https://mts-pro-envoy-vip.dna.fi/hbx/api/pub/xrtv/g/media?q=channel:${channel.site_id}&q=profile:pr&q=start-interval:${beginTimestamp}/${endTimestamp}`
  },
  parser({ content, date }) {
    let programs = []
    let items = parseItems(content, date)
    items.forEach(item => {
      const data = item?._embedded?.['xrtv:meta']?.data
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
        start: dayjs(data?.start),
        stop: dayjs(data?.end)
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

function parseItems(content, date) {
  try {
    const data = JSON.parse(content)
    let items = data?._embedded?.['xrtv:media-item']
    items = Array.isArray(items) ? items : []
    items = items.filter(item => {
      const start = item?._embedded?.['xrtv:meta']?.data?.start
      if (!start) return false

      return date.isSame(dayjs(start), 'day')
    })

    return items
  } catch {
    return []
  }
}
