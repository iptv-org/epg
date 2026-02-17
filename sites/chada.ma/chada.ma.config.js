const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'chada.ma',
  channels: 'chada.ma.channels.xml',
  days: 1,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url() {
    return 'https://chada.ma/fr/chada-tv/grille-tv/'
  },
  parser: function ({ content }) {
    const $ = cheerio.load(content)
    const programs = []

    $('#stopfix .posts-area h2').each((i, element) => {
      const timeRange = $(element).text().trim()
      const [start, stop] = timeRange.split(' - ').map(t => parseProgramTime(t.trim()))

      const titleElement = $(element).next('div').next('h3')
      const title = titleElement.text().trim()

      const description = titleElement.next('div').text().trim() || 'No description available'

      programs.push({
        title,
        description,
        start,
        stop
      })
    })

    return programs
  }
}

function parseProgramTime(timeStr) {
  const timeZone = 'Africa/Casablanca'
  const currentDate = dayjs().format('YYYY-MM-DD')

  return dayjs
    .tz(`${currentDate} ${timeStr}`, 'YYYY-MM-DD HH:mm', timeZone)
    .format('YYYY-MM-DDTHH:mm:ssZ')
}
