const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)
module.exports = {
  site: 'astro.com.my',
  url: function ({ channel }) {
    return `https://contenthub-api.eco.astro.com.my/channel/${channel.site_id}.json`
  },
  parser: function ({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const start = dayjs.utc(item.datetimeInUtc)
      const duration = parseDuration(item.duration)
      const stop = start.add(duration, 's')
      programs.push({
        title: item.title,
        start: start,
        stop: stop
      })
    })

    return programs
  }
}

function parseItems(content, date) {
  try {
    const data = JSON.parse(content)
    const schedules = data.response.schedule

    return schedules[date.format('YYYY-MM-DD')] || []
  } catch (e) {
    return []
  }
}

function parseDuration(duration) {
  const match = duration.match(/(\d{2}):(\d{2}):(\d{2})/)
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const seconds = parseInt(match[3])

  return hours * 3600 + minutes * 60 + seconds
}
