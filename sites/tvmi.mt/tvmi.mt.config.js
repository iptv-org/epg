const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'tvmi.mt',
  days: 2,
  url: function ({ date, channel }) {
    return `https://tvmi.mt/schedule/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
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
      const stop = start.add(30, 'm')
      programs.push({
        title: parseTitle($item),
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
  return $item('div > div:nth-child(2) > div:nth-child(2),a > div:nth-child(2) > div:nth-child(2)')
    .text()
    .trim()
}

function parseDescription($item) {
  return $item('div > div:nth-child(2) > div:nth-child(3),a > div:nth-child(2) > div:nth-child(3)')
    .text()
    .trim()
}

function parseIcon($item) {
  const bg = $item('div > div:nth-child(1) > div > div,a > div:nth-child(1) > div').data('bg')

  return bg ? `https:${bg}` : null
}

function parseStart($item, date) {
  const timeString = $item(
    'div > div:nth-child(2) > div:nth-child(1),a > div:nth-child(2) > div:nth-child(1)'
  )
    .text()
    .trim()
  const [_, HH, mm] = timeString.match(/^(\d{2}):(\d{2})/) || [null, null, null]
  if (!HH || !mm) return null

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${HH}:${mm}`, 'YYYY-MM-DD HH:mm', 'Europe/Malta')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('body > main > div.mt-8 > div').toArray()
}
