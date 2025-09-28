const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'roya-tv.com',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ date }) {
    const diff = date.diff(dayjs.utc().startOf('d'), 'd')

    return `https://backend.roya.tv/api/v01/channels/schedule-pagination?day_number=${diff}`
  },
  parser({ content, date, channel }) {
    const items = parseItems(content, date, channel)

    return items.map(item => {
      return {
        title: item.name,
        description: item.description,
        image: item.thumbnail_web,
        start: dayjs.unix(item.start_timestamp),
        stop: dayjs.unix(item.end_timestamp)
      }
    })
  },
  async channels() {
    const data = await axios
      .get('https://backend.roya.tv/api/v01/channels/schedule-pagination?day_number=0')
      .then(r => r.data)
      .catch(console.error)

    return data.data[0].channel.map(channel => {
      return {
        site_id: channel.id,
        name: channel.title,
        lang: 'ar'
      }
    })
  }
}

function parseItems(content, date, channel) {
  const dateString = date.format('YYYY-MM-DD')

  try {
    const data = JSON.parse(content)
    if (!data || !Array.isArray(data.data)) return []
    const dayData = data.data.find(item => item.date === dateString)
    if (!dayData || !Array.isArray(dayData.channel)) return []
    const channelData = dayData.channel.find(item => item.id == channel.site_id)
    if (!channelData || !Array.isArray(channelData.programs)) return []

    return channelData.programs
  } catch {
    return []
  }
}
