const axios = require('axios')
const { DateTime } = require('luxon')

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
      const stop = start.plus({ minutes: 30 })
      if (prev) {
        if (start < prev.start) {
          start = start.plus({ days: 1 })
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      programs.push({
        title: parseTitle(item, channel),
        start,
        stop
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
      let name = lang === 'zh' ? c.channel_name : c.channel_name_en
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
  let meridiem = item.session_mark === 'PM' ? 'PM' : 'AM'
  return DateTime.fromFormat(
    `${date.format('YYYY-MM-DD')} ${item.time} ${meridiem}`,
    'yyyy-MM-dd hh:mm a',
    { zone: 'Asia/Hong_Kong' }
  ).toUTC()
}

function parseItems(content, date) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.epgs)) return []

  return data.epgs
}
