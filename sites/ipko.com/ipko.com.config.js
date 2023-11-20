const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'ipko.com',
  days: 2,
  url: function ({ date }) {
    return `https://www.ipko.com/epg/admin/programs.php?date=${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const start = parseStart(item, date)
      const stop = start.add(item.duration / 3, 'm')

      programs.push({
        title: item.program_name,
        description: item.description,
        category: item.category,
        start: start.toString(),
        stop: stop.toString()
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')

    const data = await axios
      .get(`https://www.ipko.com/epg/admin/channels.php`)
      .then(r => r.data)
      .catch(console.log)

    let channels = []
    data.element.forEach(item => {
      channels.push({
        lang: 'sq',
        site_id: item.channel_id,
        name: item.channel_name
      })
    })

    return channels
  }
}

function parseStart(item, date) {
  const time = `${date.format('YYYY-MM-DD')} ${item.date}`

  return dayjs.utc(time, 'YYYY-MM-DD HH:mm:ss')
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  const arr = Object.values(data.element)
  const items = arr.find(el => {
    return el[0] && el[0].channel_id == channel.site_id
  })

  return Array.isArray(items) ? items : []
}
