const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'aljazeera.com',
  days: 2,
  url({ channel }) {
    const [site_id, suffix] = channel.site_id.split('#')
    const postName = suffix ? `schedule-${suffix}` : 'schedule'
    const variables = JSON.stringify({
      postName,
      preview: ''
    })
    const extensions = JSON.stringify({})

    return `https://www.aljazeera.com/graphql?wp-site=${site_id}&operationName=ArchipelagoSchedulePageQuery&variables=${variables}&extensions=${extensions}`
  },
  request: {
    headers({ channel }) {
      const [site_id] = channel.site_id.split('#')

      return {
        'wp-site': site_id
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
      { site_id: 'aje#', lang: 'en', xmltv_id: 'AlJazeera.qa@English', name: 'Al Jazeera English' },
      { site_id: 'aja#', lang: 'ar', xmltv_id: 'AlJazeera.qa@Arabic', name: 'Al Jazeera Arabic' },
      { site_id: 'aja#aj2', lang: 'ar', xmltv_id: 'AlJazeera2.qa@HD', name: 'Al Jazeera 2' }
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
