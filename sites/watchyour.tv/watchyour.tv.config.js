const dayjs = require('dayjs')
const axios = require('axios')

module.exports = {
  site: 'watchyour.tv',
  days: 2,
  url: `https://www.watchyour.tv/guide.json`,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  parser: function ({ content, date, channel }) {
    let programs = []
    const items = parseItems(content, date, channel)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = start.add(parseInt(item.duration), 'm')
      programs.push({
        title: item.name,
        icon: item.icon,
        category: item.category,
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(`https://www.watchyour.tv/guide.json`)
      .then(r => r.data)
      .catch(console.log)

    return data.map(item => ({
      site_id: item.id,
      name: item.name
    }))
  }
}

function parseStart(item) {
  return dayjs.unix(parseInt(item.tms))
}

function parseItems(content, date, channel) {
  if (!content) return []
  const data = JSON.parse(content)
  if (!Array.isArray(data)) return []
  const channelData = data.find(i => i.id == channel.site_id)
  if (!channelData || !Array.isArray(channelData.shows)) return []

  return channelData.shows.filter(i => i.start_day === date.format('YYYY-MM-DD'))
}
