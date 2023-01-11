const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  skip: true, // Error: Connection timeout
  site: 'turksatkablo.com.tr',
  days: 2,
  url: function ({ date }) {
    return `https://www.turksatkablo.com.tr/userUpload/EPG/y.json?_=${date.valueOf()}`
  },
  request: {
    timeout: 60000
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      let start = parseStart(item, date)
      if (prev && start.isBefore(prev.start)) {
        start = start.add(1, 'd')
        date = date.add(1, 'd')
      }
      let stop = parseStop(item, date)
      if (prev && stop.isBefore(start)) {
        stop = stop.add(1, 'd')
        date = date.add(1, 'd')
      }
      programs.push({
        title: item.b,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  const time = `${date.format('YYYY-MM-DD')} ${item.c}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Europe/Istanbul')
}

function parseStop(item, date) {
  const time = `${date.format('YYYY-MM-DD')} ${item.d}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Europe/Istanbul')
}

function parseItems(content, channel) {
  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (e) {}
  if (!parsed || !parsed.k) return []
  const data = parsed.k.find(c => c.x == channel.site_id)

  return data ? data.p : []
}
