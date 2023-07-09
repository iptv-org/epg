const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'nhkworldpremium.com',
  days: 7,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ channel }) {
    return `https://nhkworldpremium.com/backend/api/v1/front/episodes?lang=${channel.lang}`
  },
  parser({ content, date }) {
    let programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const start = dayjs.tz(item.schedule, 'Asia/Seoul')
      const duration = parseDuration(item)
      const stop = start.add(duration, 's')
      programs.push({
        title: item.programTitle,
        sub_title: item.episodeTitle,
        start,
        stop
      })
    })

    return programs
  }
}

function parseDuration(item) {
  const [h, m, s] = item.period.split(':')

  if (!h || !m || !s) return 0

  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s)
}

function parseItems(content, date) {
  try {
    const data = JSON.parse(content)

    if (!data || !data.item || !Array.isArray(data.item.episodes)) return []

    return data.item.episodes.filter(ep => ep.schedule.startsWith(date.format('YYYY-MM-DD')))
  } catch (err) {
    return []
  }
}
