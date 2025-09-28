const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const timezones = {
  usa: 'America/New_York',
  aus: 'Australia/Sydney',
  euro: 'UTC'
}

module.exports = {
  site: 'thesportplus.com',
  days: 2,
  url({ channel, date }) {
    return `https://www.thesportplus.com/schedule_${channel.site_id}.php?d=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  parser({ content, date, channel }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date, channel)
      if (!start) return
      if (prev) {
        if (start.isBefore(prev.start) && start.hour() < 12) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(1, 'h')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseTitle($item) {
  return $item('h5:last').text().trim()
}

function parseDescription($item) {
  return $item('p').text().trim()
}

function parseStart($item, date, channel) {
  const timezone = timezones[channel.site_id]
  const time = $item('h4').text().trim()
  const dateString = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', timezone)
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('.resume-item').toArray()
}
