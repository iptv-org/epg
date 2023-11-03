const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

dayjs.extend(timezone)
dayjs.extend(utc)

module.exports = {
  site: 'firstmedia.com',
  days: 1,
  url: function ({ channel, date }) {
    return `https://api.firstmedia.com/api/content/tv-guide/list?date=${date.format('DD/MM/YYYY')}&channel=${
      channel.site_id
    }&startTime=0&endTime=24`
  },
  parser: function ({ content, channel }) {
    if (!content || !channel) return []

    let programs = []
    const items = parseItems(content, channel.site_id)
    items.forEach(item => {
      programs.push({
        title: parseTitle(item),
        description: parseDescription(item),
        start: parseStart(item).toISOString(),
        stop: parseStop(item).toISOString()
      })
    })

    return programs
  }
}

function parseItems(content, channel) {
  return JSON.parse(content.trim()).data.entries[channel] || []
}

function parseTitle(item) {
  return item.title
}

function parseDescription(item) {
  return item.long_description
}

function parseStart(item) {
  return dayjs.tz(item.startTime, 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta')
}

function parseStop(item) {
  return dayjs.tz(item.endTime, 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta')
}
