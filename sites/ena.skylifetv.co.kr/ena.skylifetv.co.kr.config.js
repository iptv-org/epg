const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'ena.skylifetv.co.kr',
  days: 2,
  url({ channel, date }) {
    return `http://ena.skylifetv.co.kr/${channel.site_id}/?day=${date.format('YYYYMMDD')}&sc_dvsn=U`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const start = parseStart($item, date)
      const duration = parseDuration($item)
      const stop = start.add(duration, 'm')
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
  return $item('.col2 > .tit').text().trim()
}

function parseRating($item) {
  const rating = $item('.col4').text().trim()

  return rating
    ? {
        system: 'KMRB',
        value: rating
      }
    : null
}

function parseDuration($item) {
  const duration = $item('.col5').text().trim()

  return duration ? parseInt(duration) : 30
}

function parseStart($item, date) {
  const time = $item('.col1').text().trim()

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul')
}

function parseItems(content, channel, date) {
  const $ = cheerio.load(content)

  return $('.tbl_schedule > tbody > tr').toArray()
}
