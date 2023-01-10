const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  delay: 5000,
  site: 'programtv.onet.pl',
  days: 2,
  url: function ({ date, channel }) {
    const currDate = dayjs.utc().startOf('d')
    const day = date.diff(currDate, 'd')

    return `https://programtv.onet.pl/program-tv/${channel.site_id}?dzien=${day}`
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
      const stop = start.add(1, 'h')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        category: parseCategory($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart($item, date) {
  const timeString = $item('.hours > .hour').text()
  const dateString = `${date.format('MM/DD/YYYY')} ${timeString}`

  return dayjs.tz(dateString, 'MM/DD/YYYY HH:mm', 'Europe/Warsaw')
}

function parseCategory($item) {
  return $item('.titles > .type').text()
}

function parseDescription($item) {
  return $item('.titles > p').text().trim()
}

function parseTitle($item) {
  return $item('.titles > a').text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#channelTV > section > div.emissions > ul > li').toArray()
}
