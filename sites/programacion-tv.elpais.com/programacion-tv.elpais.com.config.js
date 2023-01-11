const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'programacion-tv.elpais.com',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url: function ({ date }) {
    return `https://programacion-tv.elpais.com/data/parrilla_${date.format('DDMMYYYY')}.json`
  },
  parser: async function ({ content, channel }) {
    const programs = []
    const items = parseItems(content, channel)
    if (!items.length) return programs
    const programsData = await loadProgramsData(channel)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = parseStop(item)
      const details = programsData.find(p => p.id_programa === item.id_programa) || {}
      programs.push({
        title: item.title,
        sub_title: details.episode_title,
        description: details.episode_description || item.description,
        category: parseCategory(details),
        icon: parseIcon(details),
        director: parseList(details.director),
        actors: parseList(details.actors),
        writer: parseList(details.script),
        producer: parseList(details.producer),
        presenter: parseList(details.presented_by),
        composer: parseList(details.music),
        guest: parseList(details.guest_actors),
        season: parseNumber(details.season),
        episode: parseNumber(details.episode),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(`https://programacion-tv.elpais.com/data/canales.json`)
      .then(r => r.data)
      .catch(console.log)

    return Object.values(data).map(item => ({
      lang: 'es',
      site_id: item.id,
      name: item.nombre
    }))
  }
}

function parseNumber(str) {
  return typeof str === 'string' ? parseInt(str) : null
}

function parseList(str) {
  return typeof str === 'string' ? str.split(', ') : []
}

function parseIcon(details) {
  const url = new URL(details.image, 'https://programacion-tv.elpais.com/')

  return url.href
}

function parseCategory(details) {
  return [details.txt_genre, details.txt_subgenre].filter(Boolean).join('/')
}

async function loadProgramsData(channel) {
  return await axios
    .get(`https://programacion-tv.elpais.com/data/programas/${channel.site_id}.json`)
    .then(r => r.data)
    .catch(console.log)
}

function parseStart(item) {
  return dayjs.tz(item.iniDate, 'YYYY-MM-DD HH:mm:ss', 'Europe/Madrid')
}

function parseStop(item) {
  return dayjs.tz(item.endDate, 'YYYY-MM-DD HH:mm:ss', 'Europe/Madrid')
}

function parseItems(content, channel) {
  if (!content) return []
  const data = JSON.parse(content)
  const channelData = data.find(i => i.idCanal === channel.site_id)
  if (!channelData || !Array.isArray(channelData.programas)) return []

  return channelData.programas
}
