const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const parseDuration = require('parse-duration').default
const timezone = require('dayjs/plugin/timezone')
const sortBy = require('lodash.sortby')

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'derana.lk',
  url({ date }) {
    return `https://derana.lk/api/schedules/${date.format('DD-MM-YYYY')}`
  },
  parser({ content }) {
    const programs = parseItems(content).map(item => {
      const start = parseStart(item)
      const duration = parseDuration(item.duration)
      const stop = start.add(duration, 'ms')

      return {
        title: item.dramaName,
        image: item.imageUrl,
        start,
        stop
      }
    })

    return sortBy(programs, p => p.start.valueOf())
  }
}

function parseStart(item) {
  return dayjs.tz(`${item.date} ${item.time}`, 'DD-MM-YYYY H:mm A', 'Asia/Colombo')
}

function parseItems(content) {
  try {
    const data = JSON.parse(content)
    if (!data || !Array.isArray(data.all_schedules)) return []

    return data.all_schedules
  } catch {
    return []
  }
}
