const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'singtel.com',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ date }) {
    return `https://www.singtel.com/etc/singtel/public/tv/epg-parsed-data/${date.format('DDMMYYYY')}.json`
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const start = dayjs.utc(item.startDateTime)
      const stop = start.add(item.duration, 's')
      programs.push({
        title: item.program.title,
        category: item.program.subCategory,
        description: item.program.description,
        start,
        stop
      })
    })

    return programs
  }
}

function parseItems(content, channel) {
  try {
    const data = JSON.parse(content)
    return data && data[channel.site_id] ? data[channel.site_id] : []
  } catch (err) {
    return []
  }
}