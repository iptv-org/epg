const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'sportsnet.ca',
  days: 2,
  url: function ({ channel, date }) {
    return `https://production-cdn.sportsnet.ca/api/schedules?channels=${
      channel.site_id
    }&date=${date.format('YYYY-MM-DD')}&duration=24&hour=0`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.item.title,
        description: item.item.shortDescription,
        icon: parseIcon(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  }
}

function parseIcon(item) {
  if (!item.item || !item.item.images) return null

  return item.item.images.tile
}

function parseStart(item) {
  return dayjs.utc(item.startDate)
}

function parseStop(item) {
  return dayjs.utc(item.endDate)
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!Array.isArray(data) || !Array.isArray(data[0].schedules)) return []

  return data[0].schedules
}
