const cheerio = require('cheerio')
const iconv = require('iconv-lite')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'm.tv.sms.cz',
  days: 2,
  url: function ({ date, channel }) {
    return `https://m.tv.sms.cz/index.php?stanice=${channel.site_id}&cas=0&den=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  parser: function ({ buffer, date }) {
    const programs = []
    const items = parseItems(buffer)
    items.forEach((item, i) => {
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
      const stop = start.add(1, 'h')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart($item, date) {
  const timeString = $item('div > span').text().trim()
  const dateString = `${date.format('MM/DD/YYYY')} ${timeString}`

  return dayjs.tz(dateString, 'MM/DD/YYYY HH.mm', 'Europe/Prague')
}

function parseDescription($item) {
  return $item('a.nazev > div.detail').text().trim()
}

function parseTitle($item) {
  return $item('a.nazev > div:nth-child(1)').text().trim()
}

function parseItems(buffer) {
  const string = iconv.decode(buffer, 'win1250')
  const $ = cheerio.load(string)

  return $('#obsah > div > div.porady > div.porad').toArray()
}
