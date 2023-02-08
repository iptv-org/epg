const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'mediagenie.co.kr',
  days: 1,
  skip: true, // NOTE: the guide appears on the site after the end of the daily update (https://github.com/iptv-org/epg/actions/workflows/mediagenie.co.kr.yml)
  url({ channel, date }) {
    return `https://mediagenie.co.kr/${channel.site_id}/?qd=${date.format('YYYYMMDD')}`
  },
  request: {
    headers: {
      cookie: 'CUPID=d5ed6b77012aef2b4d4365ffd3a1a3a4'
    }
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      const start = parseStart($item, date)
      if (!start) return
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
        rating: parseRating($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseTitle($item) {
  return $item('.col2').clone().children().remove().end().text().trim()
}

function parseRating($item) {
  const rating = $item('.col6').text().trim()

  return rating
    ? {
        system: 'KMRB',
        value: rating
      }
    : null
}

function parseStart($item, date) {
  const time = $item('.col1').text().trim()

  if (!/^\d{2}:\d{2}$/.test(time)) return null

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul')
}

function parseItems(content, channel, date) {
  const $ = cheerio.load(content)

  return $('.tbl > tbody > tr').toArray()
}
