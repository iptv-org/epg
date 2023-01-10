const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const API_ENDPOINT = 'http://epg.i-cable.com/ci/channel'

module.exports = {
  site: 'epg.i-cable.com',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1h
    }
  },
  url: function ({ channel, date }) {
    return `${API_ENDPOINT}/epg/${channel.site_id}/${date.format('YYYY-MM-DD')}?api=api`
  },
  parser({ content, channel, date }) {
    const programs = []
    const items = parseItems(content, date)
    for (let item of items) {
      const prev = programs[programs.length - 1]
      let start = parseStart(item, date)
      const stop = start.add(30, 'm')
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      programs.push({
        title: parseTitle(item, channel),
        start: start,
        stop: stop
      })
    }

    return programs
  },
  async channels({ lang }) {
    const data = await axios
      .get(`${API_ENDPOINT}/category/0?api=api`)
      .then(r => r.data)
      .catch(console.error)

    let channels = []
    const promises = data.cates.map(c => axios.get(`${API_ENDPOINT}/category/${c.cate_id}?api=api`))
    await Promise.allSettled(promises).then(results => {
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          channels = channels.concat(r.value.data.chs)
        }
      })
    })

    return channels.map(c => {
      let name = lang === 'en' ? c.channel_name_en : c.channel_name
      name = c.remark_id == 3 ? `${name} [HD]` : name

      return {
        site_id: c.channel_no,
        name,
        lang
      }
    })
  }
}

function parseTitle(item, channel) {
  return channel.lang === 'en' ? item.programme_name_eng : item.programme_name_chi
}

function parseStart(item, date) {
  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${item.time} ${item.session_mark}`,
    'YYYY-MM-DD hh:mm A',
    'Asia/Hong_Kong'
  )
}

function parseItems(content, date) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.epgs)) return []

  return data.epgs
}
