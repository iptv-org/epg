const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'antennasatellite.gr',
  days: 2,
  url({ date }) {
    return `https://www.antennasatellite.gr/el/tvguide.html?date=${date.format('YYYY-MM-DD')}`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(30, 'm')
      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseTitle($item) {
  return $item('.title').text().trim()
}

function parseStart($item, date) {
  const time = $item('dt.col-time').clone().children().remove().end().text().trim()

  return time
    ? dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Europe/Athens')
    : null
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('dl.show').toArray()
}
