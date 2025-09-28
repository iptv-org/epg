const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const API_ENDPOINT = 'https://contenthub-api.eco.astro.com.my'

module.exports = {
  site: 'content.astro.com.my',
  days: 2,
  url: function ({ channel }) {
    return `${API_ENDPOINT}/channel/${channel.site_id}.json`
  },
  async parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    for (let item of items) {
      const start = dayjs.utc(item.datetimeInUtc)
      const duration = parseDuration(item.duration)
      const stop = start.add(duration, 's')
      const details = await loadProgramDetails(item)
      programs.push({
        title: details.title,
        sub_title: item.subtitles,
        description: details.longSynopsis || details.shortSynopsis,
        actors: parseList(details.cast),
        directors: parseList(details.director),
        image: details.imageUrl,
        rating: parseRating(details),
        categories: parseCategories(details),
        episode: parseEpisode(item),
        season: parseSeason(details),
        start: start,
        stop: stop
      })
    }

    return programs
  },
  async channels() {
    const data = await axios
      .get('https://contenthub-api.eco.astro.com.my/channel/all.json')
      .then(r => r.data)
      .catch(console.log)

    return data.response.map(item => {
      return {
        lang: 'ms',
        site_id: item.id,
        name: item.title
      }
    })
  }
}

function parseEpisode(item) {
  const [, number] = item.title.match(/Ep(\d+)$/) || [null, null]

  return number ? parseInt(number) : null
}

function parseSeason(details) {
  const [, season] = details.title ? details.title.match(/ S(\d+)/) || [null, null] : [null, null]

  return season ? parseInt(season) : null
}

function parseList(list) {
  return typeof list === 'string' ? list.split(',') : []
}

function parseRating(details) {
  return details.certification
    ? {
        system: 'LPF',
        value: details.certification
      }
    : null
}

function parseItems(content, date) {
  try {
    const data = JSON.parse(content)
    const schedules = data.response.schedule

    return schedules[date.format('YYYY-MM-DD')] || []
  } catch {
    return []
  }
}

function parseDuration(duration) {
  const match = duration.match(/(\d{2}):(\d{2}):(\d{2})/)
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const seconds = parseInt(match[3])

  return hours * 3600 + minutes * 60 + seconds
}

function parseCategories(details) {
  const genres = {
    'filter/2': 'Action',
    'filter/4': 'Anime',
    'filter/12': 'Cartoons',
    'filter/16': 'Comedy',
    'filter/19': 'Crime',
    'filter/24': 'Drama',
    'filter/25': 'Educational',
    'filter/36': 'Horror',
    'filter/39': 'Live Action',
    'filter/55': 'Pre-school',
    'filter/56': 'Reality',
    'filter/60': 'Romance',
    'filter/68': 'Talk Show',
    'filter/69': 'Thriller',
    'filter/72': 'Variety',
    'filter/75': 'Series',
    'filter/100': 'Others (Children)'
  }

  return Array.isArray(details.subFilter)
    ? details.subFilter.map(g => genres[g.toLowerCase()]).filter(Boolean)
    : []
}

async function loadProgramDetails(item) {
  const url = `${API_ENDPOINT}/api/v1/linear-detail?siTrafficKey=${item.siTrafficKey}`
  const data = await axios
    .get(url)
    .then(r => r.data)
    .catch(error => console.log(error.message))
  if (!data) return {}

  return data.response || {}
}
