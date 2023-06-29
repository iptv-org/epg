const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const cheerio = require('cheerio')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'visionplus.id',
  days: 2,
  request: {
    headers: {
      Authorization:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE5NDY0NTE4OTcsInVpZCI6MCwicGwiOiJ3ZWIiLCJndWVzdF90b2tlbiI6ImNhNGNjMjdiNzc3MjBjODEwNzQ2YzY3MTY4NzNjMDI3NGU4NWYxMWQifQ.tt08jLZ3HiNadUeSgc9O-nhIzEi7WMYRjxMb05lEZ74'
    }
  },
  url({ date, channel }) {
    return `https://epg-api.visionplus.id/api/v1/epg?isLive=false&start_time_from=${date.format(
      'YYYY-MM-DD'
    )}&channel_ids=${channel.site_id}`
  },
  parser({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      let prev = programs[programs.length - 1]
      let start = parseStart(item, date)
      let stop = parseStop(item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
        }
        if (stop.isBefore(prev.stop)) {
          stop = stop.add(1, 'd')
        }
      }

      programs.push({
        title: item.t,
        description: item.synopsis,
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const xml = await axios
      .get(`https://www.visionplus.id/sitemap-channels.xml`)
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(xml)
    const items = $('url').toArray()

    return items.map(item => {
      const $item = cheerio.load(item)
      const loc = $item('loc').text()
      const [, site_id] = loc.match(/channel\/(\d+)\//) || [null, null]

      return {
        site_id,
        name: $item('video\\:title').text().trim()
      }
    })
  }
}

function parseStart(item, date) {
  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${item.s}`, 'YYYY-MM-DD HH:mm', 'Asia/Jakarta')
}

function parseStop(item, date) {
  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${item.e}`, 'YYYY-MM-DD HH:mm', 'Asia/Jakarta')
}

function parseItems(content, channel, date) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.data)) return []
  const channelData = data.data.find(c => c.id === channel.site_id)
  if (!channelData || !Array.isArray(channelData.schedules)) return []
  const daySchedule = channelData.schedules.find(d => d.date === date.format('YYYY-MM-DD'))
  if (!daySchedule || !Array.isArray(daySchedule.items)) return []

  return daySchedule.items
}
