const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'ruv.is',
  days: 2,
  url({ channel, date }) {
    let params = new URLSearchParams()
    params.append('operationName', 'getSchedule')
    params.append(
      'variables',
      JSON.stringify({ channel: channel.site_id, date: date.format('YYYY-MM-DD') })
    )
    params.append(
      'extensions',
      JSON.stringify({
        persistedQuery: {
          version: 1,
          sha256Hash: '7d133b9bd9e50127e90f2b3af1b41eb5e89cd386ed9b100b55169f395af350e6'
        }
      })
    )

    return `https://www.ruv.is/gql/?${params.toString()}`
  },
  parser({ content, date }) {
    let programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      let start = parseStart(item, date)
      let stop = parseStop(item, date)
      if (stop.isBefore(start)) {
        stop = stop.add(1, 'd')
      }
      programs.push({
        title: item.title,
        description: item.description,
        icon: parseIcon(item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseIcon(item) {
  return item.image.replace('$$IMAGESIZE$$', '480')
}

function parseStart(item, date) {
  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${item.start_time_friendly}`,
    'YYYY-MM-DD HH:mm',
    'Atlantic/Reykjavik'
  )
}

function parseStop(item, date) {
  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${item.end_time_friendly}`,
    'YYYY-MM-DD HH:mm',
    'Atlantic/Reykjavik'
  )
}

function parseItems(content, channel, date) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.data.Schedule.events)) return []

  return data.data.Schedule.events
}
