const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'turksatkablo.com.tr',
  days: 2,
  url({ date }) {
    const dayOfMonth = date.format('DD') // Get the current day of the month (01-31)

    return `https://www.turksatkablo.com.tr/userUpload/EPG/${dayOfMonth}.json?_=${date.valueOf()}`
  },
  request: {
    timeout: 60000,
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      let start = parseStart(item, date)
      if (prev && start < prev.start) {
        start = start.add(1, 'day')
        date = date.add(1, 'day')
      }
      let stop = parseStop(item, date)
      if (prev && stop < start) {
        stop = stop.add(1, 'day')
        date = date.add(1, 'day')
      }
      programs.push({
        title: item.b,
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const dayjs = require('dayjs')
    const dayOfMonth = dayjs().format('DD')

    const data = await axios
      .get(`https://www.turksatkablo.com.tr/userUpload/EPG/${dayOfMonth}.json`)
      .then(r => r.data)
      .catch(console.log)

    let channels = []

    data.k.forEach(item => {
      channels.push({
        lang: 'tr',
        site_id: item.x,
        name: item.n
      })
    })

    return channels
  }
}

function parseStart(item, date) {
  const time = `${date.format('YYYY-MM-DD')} ${item.c}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Europe/Istanbul').utc()
}

function parseStop(item, date) {
  const time = `${date.format('YYYY-MM-DD')} ${item.d}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Europe/Istanbul').utc()
}

function parseItems(content, channel) {
  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    return []
  }
  if (!parsed || !parsed.k) return []
  const data = parsed.k.find(c => c.x == channel.site_id)

  return data ? data.p : []
}
