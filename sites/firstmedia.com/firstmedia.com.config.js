const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

dayjs.extend(timezone)
dayjs.extend(utc)

module.exports = {
  site: 'firstmedia.com',
  days: 2,
  url({ channel, date }) {
    return `https://api.firstmedia.com/api/content/tv-guide/list?date=${date.format(
      'DD/MM/YYYY'
    )}&channel=${channel.site_id}&startTime=1&endTime=24`
  },
  parser({ content, channel, date }) {
    if (!content || !channel || !date) return []

    const programs = []
    const items = parseItems(content, channel.site_id)
      .map(item => {
        item.start = toDelta(item.date, item.startTime)
        item.stop = toDelta(item.date, item.endTime)
        return item
      })
      .sort((a, b) => a.start - b.start)

    const dt = date.tz('Asia/Jakarta').startOf('d')
    let lastStop
    items.forEach(item => {
      if (lastStop === undefined || item.start >= lastStop) {
        lastStop = item.stop
        programs.push({
          title: parseTitle(item),
          description: parseDescription(item),
          start: asDate(parseStart({ item, date: dt })),
          stop: asDate(parseStop({ item, date: dt }))
        })
      }
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const result = await axios
      .get(
        `https://api.firstmedia.com/api/content/tv-guide/list?date=${dayjs().format(
          'DD/MM/YYYY'
        )}&channel=&startTime=0&endTime=24`
      )
      .then(response => response.data)
      .catch(console.error)

    const channels = []
    if (result.data && result.data.entries) {
      Object.values(result.data.entries).forEach(schedules => {
        if (schedules.length) {
          channels.push({
            lang: 'en',
            site_id: schedules[0].channel.no,
            name: schedules[0].channel.name
          })
        }
      })
    }

    return channels
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

function parseStart({ item, date }) {
  return date.add(item.start, 'ms')
}

function parseStop({ item, date }) {
  return date.add(item.stop, 'ms')
}

function toDelta(from, to) {
  return toDate(to).diff(toDate(from), 'milliseconds')
}

function toDate(date) {
  return dayjs(date, 'YYYY-MM-DD HH:mm:ss')
}

function asDate(date) {
  return date.toISOString()
}
