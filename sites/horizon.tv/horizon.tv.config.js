const axios = require('axios')
const dayjs = require('dayjs')

const API_ENDPOINT = `https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web`

module.exports = {
  site: 'horizon.tv',
  days: 3,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url: function ({ date }) {
    return `${API_ENDPOINT}/programschedules/${date.format('YYYYMMDD')}/1`
  },
  async parser({ content, channel, date }) {
    let programs = []
    let items = parseItems(content, channel)
    if (!items.length) return programs
    const d = date.format('YYYYMMDD')
    const promises = [
      axios.get(`${API_ENDPOINT}/programschedules/${d}/2`),
      axios.get(`${API_ENDPOINT}/programschedules/${d}/3`),
      axios.get(`${API_ENDPOINT}/programschedules/${d}/4`)
    ]
    await Promise.allSettled(promises)
      .then(results => {
        results.forEach(r => {
          if (r.status === 'fulfilled') {
            items = items.concat(parseItems(r.value.data, channel))
          }
        })
      })
      .catch(console.error)
    for (let item of items) {
      const detail = await loadProgramDetails(item)
      programs.push({
        title: item.t,
        description: parseDescription(detail),
        category: parseCategory(detail),
        season: parseSeason(detail),
        episode: parseEpisode(detail),
        actors: parseActors(detail),
        directors: parseDirectors(detail),
        date: parseYear(detail),
        start: parseStart(item),
        stop: parseStop(item)
      })
    }

    return programs
  },
  async channels() {
    const data = await axios
      .get(`${API_ENDPOINT}/channels`)
      .then(r => r.data)
      .catch(console.log)

    return data.channels.map(item => {
      return {
        lang: 'sk',
        site_id: item.id.replace('lgi-obolite-sk-prod-master:5-', ''),
        name: item.title
      }
    })
  }
}

async function loadProgramDetails(item) {
  if (!item.i) return {}
  const url = `${API_ENDPOINT}/listings/${item.i}`
  const data = await axios
    .get(url)
    .then(r => r.data)
    .catch(console.log)
  return data || {}
}

function parseStart(item) {
  return dayjs(item.s)
}

function parseStop(item) {
  return dayjs(item.e)
}

function parseItems(content, channel) {
  if (!content) return []
  const data = (typeof content === 'string') ? JSON.parse(content) : content
  if (!data || !Array.isArray(data.entries)) return []
  const entity = data.entries.find(e => e.o === `lgi-obolite-sk-prod-master:${channel.site_id}`)
  return entity ? entity.l : []
}

function parseDescription(detail) {
  if (!detail) return []
  if (!detail.program) return []
  return detail.program.longDescription || null
}

function parseCategory(detail) {
  if (!detail) return []
  if (!detail.program) return []
  if (!detail.program.categories) return []
  let categories = []
  detail.program.categories.forEach(category => {
    categories.push(category.title)
  })
  return categories
}

function parseSeason(detail) {
  if (!detail) return null
  if (!detail.program) return null
  if (!detail.program.seriesNumber) return null
  if (String(detail.program.seriesNumber).length > 2) return null
  return detail.program.seriesNumber
}

function parseEpisode(detail) {
  if (!detail) return null
  if (!detail.program) return null
  if (!detail.program.seriesEpisodeNumber) return null
  if (String(detail.program.seriesEpisodeNumber).length > 3) return null
  return detail.program.seriesEpisodeNumber
}

function parseDirectors(detail) {
  if (!detail) return []
  if (!detail.program) return []
  return detail.program.directors || []
}

function parseActors(detail) {
  if (!detail) return []
  if (!detail.program) return []
  return detail.program.cast || []
}

function parseYear(detail) {
  if (!detail) return null
  if (!detail.program) return null
  return detail.program.year || null
}