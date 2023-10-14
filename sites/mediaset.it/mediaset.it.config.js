const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

module.exports = {
  site: 'mediaset.it',
  days: 2,
  url: function ({ date, channel }) {
    return `http://www.mediaset.it/guidatv/inc/canali/${date.format('YYYYMM')}/${date.format(
      'YYYYMMDD'
    )}_${channel.site_id}.sjson`
  },
  parser: function ({ content, date }) {
    const programs = []
    const data = JSON.parse(content)
    if (!data.events) return programs

    data.events.forEach(item => {
      if (item.title && item.startTime && item.duration) {
        const start = parseStart(item, date)
        const duration = parseInt(item.duration)
        const stop = start.add(duration, 'm')

        programs.push({
          title: item.displayTitle || item.title,
          description: item.description,
          category: item.genere,
          start,
          stop
        })
      }
    })

    return programs
  }
}

function parseStart(item, date) {
  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${item.startTime}`, 'YYYY-MM-DD HH:mm', 'Europe/Rome')
}
