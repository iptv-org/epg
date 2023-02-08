const axios = require('axios')
const dayjs = require('dayjs')

const API_ENDPOINT = 'https://www.tccvivo.com.uy/api/v1/navigation_filter/1575/filter/'

module.exports = {
  site: 'programacion.tcc.com.uy',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    },
    maxContentLength: 10 * 1024 * 1024 // 30Mb
  },
  url: function ({ date }) {
    return `${API_ENDPOINT}?cable_operator=1&emission_start=${date.format(
      'YYYY-MM-DDTHH:mm:ss[Z]'
    )}&emission_end=${date.add(1, 'd').format('YYYY-MM-DDTHH:mm:ss[Z]')}&format=json`
  },
  parser({ content, channel }) {
    let programs = []
    let items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: parseTitle(item),
        description: parseDescription(item),
        categories: parseCategories(item),
        date: item.year,
        season: item.season_number,
        episode: item.episode_number,
        icon: parseIcon(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(
        `${API_ENDPOINT}?cable_operator=1&emission_start=${dayjs().format(
          'YYYY-MM-DDTHH:mm:ss[Z]'
        )}&emission_end=${dayjs().format('YYYY-MM-DDTHH:mm:ss[Z]')}&format=json`
      )
      .then(r => r.data)
      .catch(console.error)

    return data.results.map(c => {
      return {
        lang: 'es',
        site_id: c.id,
        name: c.name.replace(/^\[.*\]\s/, '')
      }
    })
  }
}

function parseTitle(item) {
  const localized = item.localized.find(i => i.language === 'es')

  return localized ? localized.title : item.original_title
}

function parseDescription(item) {
  const localized = item.localized.find(i => i.language === 'es')

  return localized ? localized.description : null
}

function parseCategories(item) {
  return item.genres
    .map(g => {
      const localized = g.localized.find(i => i.language === 'es')

      return localized ? localized.name : null
    })
    .filter(Boolean)
}

function parseIcon(item) {
  const uri = item.images[0] ? item.images[0].image_media.file : null

  return uri ? `https:${uri}` : null
}

function parseStart(item) {
  return dayjs(item.emission_start)
}

function parseStop(item) {
  return dayjs(item.emission_end)
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.results)) return []
  const channelData = data.results.find(c => c.id == channel.site_id)
  if (!channelData || !Array.isArray(channelData.events)) return []

  return channelData.events
}
