const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'dsmart.com.tr',
  days: 2,
  url({ date, channel }) {
    return `https://www.dsmart.com.tr/api/v1/public/epg/schedules?page=1&limit=500&day=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  parser: function ({ content, channel, date }) {
    let offset = -1
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      let start = parseStart(item, date)
      if (offset === -1 && start.hour() > 18) start = start.subtract(1, 'd')
      let stop = parseStop(item, date)
      if (offset === -1 && stop.hour() > 18) stop = stop.subtract(1, 'd')
      if (start.hour() < 18 || stop.hour() < 18) offset = 0

      programs.push({
        title: item.program_name,
        category: item.genre,
        description: item.description,
        start: start.toJSON(),
        stop: stop.toJSON()
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  return dayjs.utc(item.start_date).set('date', date.get('date'))
}

function parseStop(item, date) {
  return dayjs.utc(item.end_date).set('date', date.get('date'))
}

function parseContent(content, channel) {
  const data = JSON.parse(content)
  if (!data || !data.data || !Array.isArray(data.data.channels)) return null

  return data.data.channels.find(i => i._id == channel.site_id)
}

function parseItems(content, channel) {
  const data = parseContent(content, channel)

  return data ? data.schedule : []
}
