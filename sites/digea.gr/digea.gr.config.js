const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'digea.gr',
  days: 2,
  url: 'https://www.digea.gr/el/api/epg/get-events',
  request: {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    data({ date }) {
      const data = new URLSearchParams()
      data.append('action', 'get_events')
      data.append('date', date.format('YYYY-M-D'))

      return data
    }
  },
  parser({ content, channel }) {
    let programs = []
    let items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.long_synopsis,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .post(
        'https://www.digea.gr/el/api/epg/get-channels',
        new URLSearchParams({
          action: 'get_chanels',
          lang: 'el'
        }),
        {
          headers: {
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
          }
        }
      )
      .then(r => r.data)
      .catch(console.error)

    return data.map(channel => {
      return {
        lang: 'el',
        site_id: channel.id,
        name: channel.name
      }
    })
  }
}

function parseStart(item) {
  return dayjs.tz(item.actual_time, 'YYYY-MM-DD HH:mm:ss', 'Europe/Athens')
}

function parseStop(item) {
  return dayjs.tz(item.end_time, 'YYYY-MM-DD HH:mm:ss', 'Europe/Athens')
}

function parseItems(content, channel) {
  try {
    const data = JSON.parse(content)
    if (!Array.isArray(data)) return []

    return data.filter(p => p.channel_id === channel.site_id)
  } catch {
    return []
  }
}
