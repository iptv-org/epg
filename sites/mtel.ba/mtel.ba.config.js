const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(timezone)

module.exports = {
  site: 'mtel.ba',
  days: 2,
  url: function ({ channel, date }) {
    const [position] = channel.site_id.split('#')

    return `https://mtel.ba/oec/epg/program?date=${date.format('YYYY-MM-DD')}&position=${position}`
  },
  request: {
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      if (item.title === 'Nema informacija o programu') return
      programs.push({
        title: item.title,
        description: item.description,
        category: item.category,
        icon: item.image,
        start: parseStart(item).toJSON(),
        stop: parseStop(item).toJSON()
      })
    })

    return programs
  }
}

function parseStart(item) {
  return dayjs.tz(item.full_start, 'Europe/Sarajevo')
}

function parseStop(item) {
  return dayjs.tz(item.full_end, 'Europe/Sarajevo')
}

function parseContent(content, channel) {
  const [_, channelId] = channel.site_id.split('#')
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.channels)) return null

  return data.channels.find(i => i.id === channelId)
}

function parseItems(content, channel) {
  const data = parseContent(content, channel)

  return data ? data.items : []
}
