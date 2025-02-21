const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'dtv8.net',
  days: 2,
  url({ date }) {
    const day = date.format('dddd')

    return `https://dtv8.net/tv-listings/${day.toLowerCase()}/`
  },
  parser({ content, date }) {
    let programs = []

    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      let prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      if (prev) {
        if (start < prev.start) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(30, 'm')

      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        image: parseImage($item),
        start,
        stop
      })
    })

    return programs
  },
  channels() {
    return []
  }
}

function parseTitle($item) {
  return $item(
    'td:nth-child(2) > strong:nth-child(1),td:nth-child(2) > span > strong,td:nth-child(2) > span > b'
  ).text()
}

function parseDescription($item) {
  return (
    $item(
      'td:nth-child(2) > strong:nth-child(3) > span,td:nth-child(2) > p:nth-child(3) > strong > span'
    ).text() || null
  )
}

function parseImage($item) {
  return $item('td:nth-child(1) > img.size-full').attr('src') || null
}

function parseStart($item, date) {
  const time = $item('td:nth-child(1)').text()

  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${time}`,
    'YYYY-MM-DD HH:mm [hrs.]',
    'America/Guyana'
  )
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('table tr')
    .filter((i, el) => {
      const firstColumn = $(el).find('td').text()

      return Boolean(firstColumn) && !firstColumn.includes('Time')
    })
    .toArray()
}
