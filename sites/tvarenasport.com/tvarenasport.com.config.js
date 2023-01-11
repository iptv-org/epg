const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'tvarenasport.com',
  days: 2,
  url: function ({ channel, date }) {
    return `https://www.tvarenasport.com/api/schedule?date=${date.format('DD-MM-YYYY')}`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title.trim(),
        category: item.league,
        description: item.sport.trim(),
        start: dayjs(item.start),
        stop: dayjs(item.end)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(`https://www.tvarenasport.com/api/schedule`)
      .then(r => r.data)
      .catch(console.log)

    const channels = []
    for (let id in data.channels) {
      const item = data.channels[id]
      channels.push({
        lang: 'sr',
        site_id: id,
        name: item.name
      })
    }

    return channels
  }
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.items)) return []

  return data.items.filter(i => i.group === channel.site_id)
}
