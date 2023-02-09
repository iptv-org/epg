const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const API_ENDPOINT = 'https://www.nuevosiglo.com.uy/programacion/getGrilla'

module.exports = {
  site: 'nuevosiglo.com.uy',
  days: 2,
  url({ date }) {
    return `${API_ENDPOINT}?fecha=${date.format('YYYY/MM/DD')}`
  },
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  async parser({ content, channel }) {
    const programs = []
    const items = parseItems(content, channel)
    for (let item of items) {
      const $item = cheerio.load(item)
      const programId = parseProgramId($item)
      const details = await loadProgramDetails(programId)
      if (!details) continue
      const start = parseStart(details)
      const stop = parseStop(details)
      programs.push({
        title: details.main_title,
        description: details.short_argument,
        icon: parseIcon(details),
        actors: parseActors(details),
        rating: parseRating(details),
        date: details.year,
        start: parseStart(details),
        stop: parseStop(details)
      })
    }

    return programs
  },
  async channels() {
    const data = await axios
      .get(`${API_ENDPOINT}?fecha=${dayjs().format('YYYY/MM/DD')}`)
      .then(r => r.data)
      .catch(console.error)
    const $ = cheerio.load(data)

    return $('img')
      .map(function () {
        return {
          lang: 'es',
          site_id: $(this).attr('alt').replace('&', '&amp;'),
          name: $(this).attr('alt')
        }
      })
      .get()
  }
}

function parseProgramId($item) {
  return $item('*').data('schedule')
}

function loadProgramDetails(programId) {
  return axios
    .get(`https://www.nuevosiglo.com.uy/Programacion/getScheduleXId/${programId}`)
    .then(r => r.data)
    .catch(console.log)
}

function parseRating(details) {
  return details.parental_rating
    ? {
        system: 'MPAA',
        value: details.parental_rating
      }
    : null
}

function parseActors(details) {
  return details.actors.split(', ')
}

function parseIcon(details) {
  return details.image ? `https://img-ns.s3.amazonaws.com/grid_data/${details.image}` : null
}

function parseStart(details) {
  return dayjs.tz(details.time_start, 'YYYY-MM-DD HH:mm:ss', 'America/Montevideo')
}

function parseStop(details) {
  return dayjs.tz(details.time_end, 'YYYY-MM-DD HH:mm:ss', 'America/Montevideo')
}

function parseItems(content, channel) {
  const $ = cheerio.load(content)

  return $(`img[alt="${channel.site_id}"]`).first().nextUntil('img').toArray()
}
