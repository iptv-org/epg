const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'comteco.com.bo',
  days: 2,
  url: function ({ channel }) {
    return `https://comteco.com.bo/pages/canales-y-programacion-tv/paquete-oro/${channel.site_id}`
  },
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: function ({ date }) {
      const params = new URLSearchParams()
      params.append('_method', 'POST')
      params.append('fechaini', date.format('D/M/YYYY'))
      params.append('fechafin', date.format('D/M/YYYY'))

      return params
    }
  },
  parser: function ({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(30, 'm')
      programs.push({ title: parseTitle($item), start, stop })
    })

    return programs
  }
}

function parseStart($item, date) {
  const timeString = $item('div > div.col-xs-11 > p > span').text().trim()
  const dateString = `${date.format('YYYY-MM-DD')} ${timeString}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm:ss', 'America/La_Paz')
}

function parseTitle($item) {
  return $item('div > div.col-xs-11 > p > strong').text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#datosasociados > div > .list-group-item').toArray()
}
