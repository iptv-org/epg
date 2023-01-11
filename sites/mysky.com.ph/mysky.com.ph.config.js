const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'mysky.com.ph',
  days: 2,
  url: 'https://skyepg.mysky.com.ph/Main/getEventsbyType',
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      programs.push({
        title: item.name,
        description: item.userData.description,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const items = await axios
      .get(`https://skyepg.mysky.com.ph/Main/getEventsbyType`)
      .then(r => r.data.location)
      .catch(console.log)

    return items.map(item => ({
      site_id: item.id,
      name: item.name
    }))
  }
}

function parseStart(item) {
  return dayjs.tz(item.start, 'YYYY/MM/DD HH:mm', 'Asia/Manila')
}

function parseStop(item) {
  return dayjs.tz(item.end, 'YYYY/MM/DD HH:mm', 'Asia/Manila')
}

function parseItems(content, channel, date) {
  if (!content) return []
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.events)) return []
  const d = date.format('YYYY/MM/DD')

  return data.events.filter(i => i.location == channel.site_id && i.start.includes(d))
}
