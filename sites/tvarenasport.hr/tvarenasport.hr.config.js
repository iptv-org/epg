const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'tvarenasport.hr',
  days: 2,
  skip: true, // there is no current program on the website
  url: function ({ channel, date }) {
    return `https://www.tvarenasport.hr/api/schedule?date=${date.format('DD-MM-YYYY')}`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title.trim(),
        category: item.sport,
        description: item.league.trim(),
        start: dayjs(item.start),
        stop: dayjs(item.end)
      })
    })

    return programs
  },
  async channels({ country, lang }) {
    const data = await axios
      .get(`https://www.tvarenasport.hr/api/schedule`)
      .then(r => r.data)
      .catch(console.log)

    const channels = []
    for (let id in data.channels) {
      const item = data.channels[id]
      channels.push({
        lang: 'hr',
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
