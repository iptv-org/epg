const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  skip: true, // NOTE: Connection timeout
  site: 'zap.co.ao',
  url: function ({ date, channel }) {
    return `https://www.zap.co.ao/_api/channels/${date.format('YYYY-M-D')}/epg.json`
  },
  parser: function ({ content, channel, date }) {
    const programs = []
    const items = parseItems(content, channel)
    if (!items.length) return programs
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      let start = parseStart(item, date)
      if (prev && start.isBefore(prev.start)) {
        start = start.add(1, 'd')
        date = date.add(1, 'd')
      }
      const stop = start.add(item.duration, 's')
      programs.push({
        title: item.name,
        description: item.sinopse,
        start,
        stop
      })
    })

    return programs
  }
}

function parseItems(content, channel) {
  const channels = JSON.parse(content)
  const data = channels.find(ch => ch.id == channel.site_id)

  return data ? data.epg : []
}

function parseStart(item, date) {
  const [hours, minutes] = item.start_time.split('h')
  const dateString = `${date.format('YYYY-MM-DD')} ${hours}:${minutes}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', 'Africa/Luanda')
}
