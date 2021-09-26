const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'pt',
  days: 3,
  site: 'zap.co.ao',
  channels: 'zap.co.ao.channels.xml',
  output: '.gh-pages/guides/zap.co.ao.guide.xml',
  url: function ({ date, channel }) {
    return `https://www.zap.co.ao/_api/channels/${date.format('YYYY-M-D')}/epg.json`
  },
  logo({ content, channel }) {
    const channels = JSON.parse(content)
    const data = channels.find(ch => ch.id == channel.site_id)

    return data.image_uri
  },
  parser: function ({ content, channel }) {
    let PM = false
    const programs = []
    const items = parseItems(content, channel)
    if (!items.length) return programs
    items.forEach(item => {
      let start = parseStart(item)
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = start.add(item.duration, 's')
      programs.push({
        title: item.name,
        description: item.sinopse,
        start,
        stop
      })
    })

    return programs
  }
}

function parseItems(content, channel) {
  const channels = JSON.parse(content)
  const data = channels.find(ch => ch.id == channel.site_id)

  return data.epg
}

function parseStart(item) {
  const [date] = item.date.split('T')
  const [hours, minutes] = item.start_time.split('h')
  const time = `${date} ${hours}:${minutes}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Africa/Luanda')
}
