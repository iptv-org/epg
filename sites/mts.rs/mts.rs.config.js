const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'mts.rs',
  url({ date, channel }) {
    const [position] = channel.site_id.split('#')

    return `https://mts.rs/oec/epg/program?date=${date.format('YYYY-MM-DD')}&position=${position}`
  },
  request: {
    timeout: 10000,
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  },
  logo({ content, channel }) {
    const data = parseContent(content, channel)

    return data ? data.image : null
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const data = parseContent(content, channel)
    const items = parseItems(data)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = parseStop(item)
      programs.push({
        title: item.title,
        category: item.category,
        description: item.description,
        icon: item.image,
        start: start.toJSON(),
        stop: stop.toJSON()
      })
    })

    return programs
  }
}

function parseContent(content, channel) {
  const [_, site_id] = channel.site_id.split('#')
  if (!content) return null
  const data = JSON.parse(content)
  if (!data || !data.channels || !data.channels.length) return null

  return data.channels.find(c => c.id === site_id) || null
}

function parseStart(item, date) {
  return dayjs.tz(item.full_start, 'Europe/Belgrade')
}

function parseStop(item, date) {
  return dayjs.tz(item.full_end, 'Europe/Belgrade')
}

function parseItems(data) {
  return data && Array.isArray(data.items) ? data.items : []
}
