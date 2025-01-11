const axios = require('axios')
const parser = require('epg-parser')

module.exports = {
  site: 'epg.112114.xyz',
  days: 1,
  url: 'https://epg.112114.xyz/pp.xml',
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      programs.push({
        title: item.title?.[0]?.value,
        start: item.start,
        stop: item.stop
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get('https://epg.112114.xyz/pp.xml')
      .then(r => r.data)
      .catch(console.log)
    const { channels } = parser.parse(data)

    return channels.map(channel => ({
      lang: 'zh',
      site_id: channel.id,
      name: channel.displayName[0].value
    }))
  }
}

function parseItems(content, channel, date) {
  const { programs } = parser.parse(content)

  return programs.filter(p => p.channel === channel.site_id && date.isSame(p.start, 'day'))
}
