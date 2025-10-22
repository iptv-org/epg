const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'passie.nl',
  days: 2,
  url({ date }) {
    return `https://passie.nl/tvgids.php?day=${date.format('YYYY-MM-DD')}`
  },
  parser({ content, date }) {
    const items = parseItems(content)
    date = date.subtract(1, 'd')

    const programs = []
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)

      if (prev) {
        if (start < prev.start) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      } else {
        if (start.hour() < 23) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
      }
      const stop = start.add(60 - start.minute(), 'm')
      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#guide-focus > div > div:contains("Lees meer")').toArray()
}

function parseTitle($item) {
  return $item('div > div.col-xs-6.col-sm-7 > p > b').text().trim()
}

function parseStart($item, date) {
  const time = $item('div > div:nth-child(3) > p').text().trim()

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm [CET]', 'CET')
}
