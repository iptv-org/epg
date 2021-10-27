const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'turksatkablo.com.tr',
  url: function ({ date }) {
    return `https://www.turksatkablo.com.tr/userUpload/EPG/y.json?_=${date.valueOf()}`
  },
  parser: function ({ content, channel, date }) {
    let PM = false
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      let start = parseStart(item, date)
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      let stop = parseStop(item, date)
      if (stop.hour() > 11) PM = true
      if (stop.hour() < 12 && PM) stop = stop.add(1, 'd')

      programs.push({
        title: item.b,
        start: start.toString(),
        stop: stop.toString()
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  const time = `${date.format('MM/DD/YYYY')} ${item.c}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Istanbul')
}

function parseStop(item, date) {
  const time = `${date.format('MM/DD/YYYY')} ${item.d}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Istanbul')
}

function parseItems(content, channel) {
  const parsed = JSON.parse(content)
  const channels = parsed.k
  if (!channels) return []
  const data = channels.find(c => c.x == channel.site_id)

  return data ? data.p : []
}
