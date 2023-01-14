const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'unifi.com.my',
  days: 2,
  url: `https://unifi.com.my/tv/api/tv`,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    },
    method: 'POST',
    headers: {
      'x-requested-with': 'XMLHttpRequest'
    },
    data({ date }) {
      const params = new URLSearchParams()
      params.append('date', date.format('YYYY-MM-DD'))
      return params
    }
  },
  parser({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const start = parseStart(item, date)
      const stop = start.add(item.minute, 'minute')
      programs.push({
        title: item.name,
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
    if (!data) return []
    if (!Array.isArray(data)) return []

    const channelData = data.find(i => i.id == channel.site_id)
    return channelData.items && Array.isArray(channelData.items) ? channelData.items : []
  } catch (err) {
    return []
  }
}

function parseStart(item, date) {
  const time = `${date.format('YYYY-MM-DD')} ${item.start_time}`
  return dayjs.tz(time, 'YYYY-MM-DD H:mma', 'Asia/Kuala_Lumpur')
}
