const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'worldfishingnetwork.com',
  days: 2,
  url({ date }) {
    return `https://www.worldfishingnetwork.com/schedule/77420?day=${date.format('ddd')}`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      let $item = cheerio.load(item)
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
        sub_title: parseSubTitle($item),
        description: parseDescription($item),
        icon: parseIcon($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseTitle($item) {
  return $item('.show-title > h3').text().trim()
}

function parseSubTitle($item) {
  return $item('.show-title').clone().children().remove().end().text().trim()
}

function parseDescription($item) {
  return $item('.show-title > p').text().trim()
}

function parseIcon($item) {
  const url = $item('.show-img > img').attr('src')

  return url ? `https:${url}` : null
}

function parseStart($item, date) {
  const time = $item('.show-time > h2').clone().children().remove().end().text().trim()
  const period = $item('.show-time > h2 > span > strong').text().trim()

  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${time} ${period}`,
    'YYYY-MM-DD HH:mm A',
    'America/New_York'
  )
}

function parseItems(content, channel, date) {
  const $ = cheerio.load(content)

  return $('.show-item').toArray()
}
