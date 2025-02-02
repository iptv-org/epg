const axios = require('axios')
const dayjs = require('dayjs')

const API_KEY = 'e899f715940a209148f834702fc7f340b6b0496b62120b3ed9c9b3ec4d7dca00'

module.exports = {
  site: 'teleboy.ch',
  url({ channel, date }) {
    const begin = date.format('YYYY-MM-DD HH:mm:ss')
    const end = date.add(1, 'd').format('YYYY-MM-DD HH:mm:ss')

    return `https://api.teleboy.ch/epg/broadcasts?begin=${begin}&end=${end}&expand=flags,primary_image&station=${channel.site_id}`
  },
  request: {
    headers: {
      'x-teleboy-apikey': API_KEY
    }
  },
  parser({ content }) {
    const items = parseItems(content)

    return items.map(item => {
      return {
        start: dayjs(item.begin),
        stop: dayjs(item.end),
        title: item.title,
        subtitle: item.subtitle || null,
        description: item.short_description || null,
        date: item.year ? item.year.toString() : null,
        season: item.serie_season || null,
        episode: item.serie_episode || null,
        starRatings: parseRating(item),
        image: parseImage(item)
      }
    })
  },
  async channels() {
    const data = await axios
      .get('https://api.teleboy.ch/epg/stations', module.exports.request)
      .then(r => r.data)
      .catch(console.error)

    return data.data.items.map(channel => ({
      lang: channel.language,
      name: channel.name,
      site_id: channel.id
    }))
  }
}

function parseImage(item) {
  if (!item?.primary_image?.base_path || !item?.primary_image?.hash) return null

  return `${item.primary_image.base_path}teleboyteaser6/${item.primary_image.hash}.jpg`
}

function parseRating(item) {
  if (!item.imdb_rating) return null

  return {
    system: 'IMDb',
    value: item.imdb_rating
  }
}

function parseItems(content) {
  try {
    const data = JSON.parse(content)
    if (!data?.data?.items || !Array.isArray(data.data.items)) return []

    return data.data.items
  } catch {
    return []
  }
}
