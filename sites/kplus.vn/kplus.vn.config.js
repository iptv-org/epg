const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(timezone)
dayjs.extend(utc)

const API_ENDPOINT = `https://www.kplus.vn/Schedule/getSchedule`

module.exports = {
  site: 'kplus.vn',
  days: 2,
  skip: true, // channel list changes with each request
  url: API_ENDPOINT,
  request: {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data({ date }) {
      const params = new URLSearchParams()
      params.append('date', date.format('D-M-YYYY'))
      params.append('categories', '')

      return params
    },
    method: 'POST'
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const start = parseStart(item)
      const stop = start.add(1, 'h')
      if (prev) prev.stop = start
      programs.push({
        title: item.Program.Name,
        icon: item.Program.Images,
        category: item.Program.Genres,
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const params = new URLSearchParams()
    params.append('date', dayjs().format('D-M-YYYY'))
    params.append('categories', '')
    const data = await axios
      .post(API_ENDPOINT, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      .then(r => r.data)
      .catch(console.log)

    return data.Channels.map(item => {
      return {
        lang: 'vi',
        site_id: item.Id,
        name: item.Name
      }
    })
  }
}

function parseStart(item) {
  return dayjs.tz(item.ShowingTime, 'Asia/Ho_Chi_Minh')
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.Schedules)) return []

  return data.Schedules.filter(i => i.ChannelId == channel.site_id)
}
