const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'tivu.tv',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ channel, date }) {
    date = date.startOf('day')
    return `https://services.tivulaguida.it/api/epg/channels/${channel.site_id}/date/${date.format('YYYY-MM-DD')}`
  },
  parser: async function ({ content, channel, date }) {
    const axios = require('axios')
    let programs = []
    const items = JSON.parse(content)
    if (!items || !Array.isArray(items.events)) return programs

    const previousDay = date.subtract(1, 'day')
    let urlDayBefore
    try {
      const response = await axios.get(
        `https://services.tivulaguida.it/api/epg/channels/${channel.site_id}/date/${previousDay.format('YYYY-MM-DD')}`
      )
      urlDayBefore = response?.data
    } catch (error) {
      console.log(error)
    }
    
    const allEvents = [
      ...(urlDayBefore?.events || []),
      ...items.events
    ]

    const midnight = dayjs.tz(date.format('YYYY-MM-DD 00:00'), 'YYYY-MM-DD HH:mm', 'Europe/Rome')
    const nextMidnight = midnight.add(1, 'day')

    const seen = new Set()
    allEvents.forEach(item => {
      if (!item.program) return

      const start = dayjs.tz(item.date_start, 'DD-MM-YYYY HH:mm', 'Europe/Rome')
      const stop = dayjs.tz(item.date_end, 'DD-MM-YYYY HH:mm', 'Europe/Rome')

      if (start.isBefore(midnight) || !start.isBefore(nextMidnight)) return

      const key = `${start.format()}|${stop.format()}`
      if (seen.has(key)) return
      seen.add(key)

      programs.push({
        title: item.program.title,
        start,
        stop,
        description: item.program.description,
        icon: item.program.url_poster
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const html = await axios
      .get('https://services.tivulaguida.it/api/epg/channels.json')
      .then(r => r.data)
      .catch(console.log)

    let channels = []
    if (html && html.channels) {
      html.channels.forEach(channel => {
        channels.push({
          lang: 'it',
          site_id: channel.id,
          name: channel.name,
          logo: 'https://services.tivulaguida.it/' + channel.icon
        })
      })
    }

    return channels
  }
}