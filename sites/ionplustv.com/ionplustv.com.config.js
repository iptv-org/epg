const axios = require('axios')
const dayjs = require('dayjs')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'ionplustv.com',
  days: 2,
  url({ date }) {
    return `https://ionplustv.com/schedule/${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    for (let item of items) {
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
      const duration = parseDuration($item)
      let stop = start.add(duration, 'm')

      programs.push({
        title: parseTitle($item),
        sub_title: parseSubTitle($item),
        description: parseDescription($item),
        icon: parseIcon($item),
        rating: parseRating($item),
        start,
        stop
      })
    }

    return programs
  }
}

function parseDescription($item) {
  return $item('.panel-body > div > div > div > p:nth-child(2)').text().trim()
}

function parseIcon($item) {
  return $item('.video-thumbnail img').attr('src')
}

function parseTitle($item) {
  return $item('.show-title').text().trim()
}

function parseSubTitle($item) {
  return $item('.panel-title > div > div > div > div:nth-child(2) > p')
    .text()
    .trim()
    .replace(/\s\s+/g, ' ')
}

function parseRating($item) {
  const [_, rating] = $item('.tv-rating')
    .text()
    .match(/([^(]+)/) || [null, null]

  return rating
    ? {
        system: 'MPA',
        value: rating.trim()
      }
    : null
}

function parseStart($item, date) {
  let time = $item('.panel-title h2').clone().children().remove().end().text().trim()
  time = time.includes(':') ? time : time + ':00'
  const meridiem = $item('.panel-title h2 > .meridiem').text().trim()

  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${time} ${meridiem}`,
    'YYYY-MM-DD H:mm A',
    'America/New_York'
  )
}

function parseDuration($item) {
  const [_, duration] = $item('.tv-rating')
    .text()
    .trim()
    .match(/\((\d+)/) || [null, null]

  return parseInt(duration)
}

function parseItems(content) {
  if (!content) return []
  const $ = cheerio.load(content)

  return $(`#accordion > div`).toArray()
}
