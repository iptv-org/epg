const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'aljazeera.com',
  days: 2,
  url({ channel }) {
    return `https://www.aljazeera.com/graphql?wp-site=${channel.site_id}&operationName=ArchipelagoSchedulePageQuery&variables=%7B%22postName%22%3A%22schedule%22%2C%22preview%22%3A%22%22%7D`
  },
  request: {
    headers({ channel }) {
      return {
        'wp-site': channel.site_id
      }
    }
  },
  parser({ content, date }) {
    const items = parseItems(content, date)

    return items.map(item => {
      const start = parseStart(item, date)
      const duration = parseDuration(item.duration)
      const stop = start.add(duration, 's')

      return {
        title: item.showName,
        description: item.showDescription,
        start,
        stop
      }
    })
  },
  channels() {
    return [
      { site_id: 'aje', lang: 'en', xmltv_id: 'AlJazeera.qa@English', name: 'Al Jazeera English' },
      { site_id: 'aja', lang: 'ar', xmltv_id: 'AlJazeera.qa@Arabic', name: 'Al Jazeera Arabic' }
    ]
  }
}

function parseStart(item, date) {
  return dayjs(`${date.format('YYYY-MM-DD')} ${item.showTimeslot}`, 'YYYY-MM-DD HH:mm').utc()
}

function parseDuration(duration) {
  const [, HH, mm, ss] = duration.match(/(\d+):(\d+)(?::(\d+))?/)

  return parseInt(HH) * 3600 + parseInt(mm) * 60 + parseInt(ss || 0)
}

function parseItems(content, date) {
  try {
    const data = JSON.parse(content)
    if (!data?.data?.post || !Array.isArray(data.data.post.schedule)) return []

    const startOfDay = date.startOf('day')

    return data.data.post.schedule.filter(item => item.startDate === startOfDay.unix().toString())
  } catch {
    return []
  }
}
