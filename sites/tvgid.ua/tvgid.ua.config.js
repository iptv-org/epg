const iconv = require('iconv-lite')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tvgid.ua',
  skip: true, // NOTE: the current program is not currently available on the website
  url: function ({ date, channel }) {
    return `https://tvgid.ua/channels/${channel.site_id}/${date.format('DDMMYYYY')}/tmall/`
  },
  parser: function ({ buffer, date }) {
    const programs = []
    const items = parseItems(buffer)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      if (!start) return
      const stop = start.add(1, 'h')
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }

      programs.push({ title: parseTitle($item), start, stop })
    })

    return programs
  }
}

function parseStart($item, date) {
  const timeString = $item('td > table > tbody > tr > td.time').text()
  if (!timeString) return null
  const dateString = `${date.format('MM/DD/YYYY')} ${timeString}`

  return dayjs.tz(dateString, 'MM/DD/YYYY HH:mm', 'Europe/Kiev')
}

function parseTitle($item) {
  return $item('td > table > tbody > tr > td.item').text().trim()
}

function parseItems(buffer) {
  if (!buffer) return []
  const html = iconv.decode(buffer, 'win1251')
  const $ = cheerio.load(html)

  return $(
    '#container > tbody > tr:nth-child(2) > td > table > tbody > tr > td > table:nth-child(2) > tbody > tr:not(:first-child)'
  ).toArray()
}
