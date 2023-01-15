const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'dsmart.com.tr',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 1000 // 60 seconds response cache
    }
  },
  url({ date, channel }) {
    return `https://www.dsmart.com.tr/api/v1/public/epg/schedules?page=1&limit=500&day=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  parser: function ({ content, channel }) {
    let offset = -1
    let programs = []
    const items = parseItems(content, channel)
    items.forEach((item, i) => {
      const prev = programs[programs.length - 1]
      let start
      if (prev) {
        start = parseStart(item, prev.stop)
      } else {
        start = parseStart(item, dayjs.utc(item.day))
      }
      let duration = parseDuration(item)
      let stop = start.add(duration, 's')

      programs.push({
        title: item.program_name,
        category: item.genre,
        description: item.description.trim(),
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  const time = dayjs.utc(item.start_date)

  return dayjs.utc(`${date.format('YYYY-MM-DD')} ${time.format('HH:mm:ss')}`, 'YYYY-MM-DD HH:mm:ss')
}

function parseDuration(item) {
  const [_, H, mm, ss] = item.duration.match(/(\d+):(\d+):(\d+)$/)

  return parseInt(H) * 3600 + parseInt(mm) * 60 + parseInt(ss)
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !data.data || !Array.isArray(data.data.channels)) return null
  const channelData = data.data.channels.find(i => i._id == channel.site_id)

  return channelData && Array.isArray(channelData.schedule) ? channelData.schedule : []
}
