const dayjs = require('dayjs')
const axios = require('axios')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'skylife.co.kr',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ date }) {
    return `https://www.skylife.co.kr/api/api/public/tv/schedule/${date.format('YYYYMMDD')}`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.name,
        description: item.summary,
        category: item.mainCategory,
        actors: parseCast(item.cast),
        start: parseTime(item.startTime),
        stop: parseTime(item.endTime)
      })
    })

    return programs
  },
  async channels() {
    let channels = []

    const url = `https://www.skylife.co.kr/api/api/public/tv/schedule/${dayjs().format('YYYYMMDD')}`
    const data = await axios
      .get(url)
      .then(r => r.data)
      .catch(console.log)

    for (let category of data) {
      for (let channel of category.channels) {
        channels.push({
          name: channel.name,
          site_id: `${category.code}#${channel.id}`,
          lang: 'ko'
        })
      }
    }

    return channels
  }
}

function parseCast(cast) {
  if (!cast) return []

  return cast.split(',')
}

function parseTime(time) {
  return dayjs.tz(time, 'YYYYMMDDHHmmss', 'Asia/Seoul')
}

function parseItems(content, channel) {
  const [categoryCode, channelId] = channel.site_id.split('#')
  const data = JSON.parse(content)
  if (!Array.isArray(data)) return []
  const category = data.find(_category => _category.code === categoryCode)
  if (!category || !Array.isArray(category.channels)) return []
  const channelData = category.channels.find(_channel => _channel.id === channelId)
  if (!channelData || !Array.isArray(channelData.programs)) return []

  return channelData.programs
}
