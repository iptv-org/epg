const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

const API_ENDPOINT = 'https://content-api.mytvsuper.com/v1'

module.exports = {
  site: 'mytvsuper.com',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1h
    }
  },
  url: function ({ channel, date }) {
    return `${API_ENDPOINT}/epg?network_code=${channel.site_id}&from=${date.format(
      'YYYYMMDD'
    )}&to=${date.format('YYYYMMDD')}&platform=web`
  },
  parser({ content, channel, date }) {
    const programs = []
    const items = parseItems(content, date)
    for (let item of items) {
      const prev = programs[programs.length - 1]
      const start = parseStart(item)
      const stop = start.add(30, 'm')
      if (prev) {
        prev.stop = start
      }
      programs.push({
        title: parseTitle(item, channel),
        description: parseDescription(item, channel),
        episode: parseInt(item.episode_no),
        start: start,
        stop: stop
      })
    }

    return programs
  },
  async channels({ lang }) {
    const data = await axios
      .get(`${API_ENDPOINT}/channel/list?platform=web`)
      .then(r => r.data)
      .catch(console.error)

    return data.channels.map(c => {
      const name = lang === 'en' ? c.name_en : c.name_tc

      return {
        site_id: c.network_code,
        name,
        lang
      }
    })
  }
}

function parseTitle(item, channel) {
  return channel.lang === 'en' ? item.programme_title_en : item.programme_title_tc
}

function parseDescription(item, channel) {
  return channel.lang === 'en' ? item.episode_synopsis_en : item.episode_synopsis_tc
}

function parseStart(item) {
  return dayjs.tz(item.start_datetime, 'Asia/Hong_Kong')
}

function parseItems(content, date) {
  const data = JSON.parse(content)
  if (!Array.isArray(data) || !data.length || !Array.isArray(data[0].item)) return []
  const dayData = data[0].item.find(i => i.date === date.format('YYYY-MM-DD'))
  if (!dayData || !Array.isArray(dayData.epg)) return []

  return dayData.epg
}
