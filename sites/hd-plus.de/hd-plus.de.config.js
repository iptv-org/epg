const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'hd-plus.de',
  days: 2,
  url({ date, channel }) {
    const today = dayjs().utc().startOf('d')
    const day = date.diff(today, 'd')

    return `https://www.hd-plus.de/epg/channel/${channel.site_id}?d=${day}`
  },
  parser({ content, date }) {
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
      programs.push({ title: parseTitle($item), start, stop })
    })

    return programs
  }
}

function parseStart($item, date) {
  const timeString = $item('td:nth-child(2)').text().split(' ').pop()
  const dateString = `${date.format('YYYY-MM-DD')} ${timeString}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', 'Europe/Berlin')
}

function parseTitle($item) {
  return $item('td:nth-child(1) > a').text()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('table > tbody > tr').toArray()
}
