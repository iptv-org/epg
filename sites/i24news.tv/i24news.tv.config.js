const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'i24news.tv',
  days: 2,
  url: function ({ channel }) {
    const [lang] = channel.site_id.split('#')

    return `https://api.i24news.tv/v2/${lang}/schedules/world`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      if (!item.show) return
      programs.push({
        title: item.show.title,
        description: item.show.body,
        icon: parseIcon(item),
        start: parseStart(item, date),
        stop: parseStop(item, date)
      })
    })

    return programs
  }
}

function parseIcon(item) {
  return item.show.image ? item.show.image.href : null
}

function parseStart(item, date) {
  if (!item.startHour) return null

  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${item.startHour}`,
    'YYYY-MM-DD HH:mm',
    'Asia/Jerusalem'
  )
}

function parseStop(item, date) {
  if (!item.endHour) return null

  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${item.endHour}`,
    'YYYY-MM-DD HH:mm',
    'Asia/Jerusalem'
  )
}

function parseItems(content, date) {
  const data = JSON.parse(content)
  if (!Array.isArray(data)) return []
  let day = date.day() - 1
  day = day < 0 ? 6 : day

  return data.filter(item => item.day === day)
}
