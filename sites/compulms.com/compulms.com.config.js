const parser = require('epg-parser')

module.exports = {
  site: 'compulms.com',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url: 'https://raw.githubusercontent.com/luisms123/tdt/master/guiaenergeek.xml',
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      programs.push({
        title: item.title?.[0].value,
        description: item.desc?.[0].value,
        icon: item.icon?.[0],
        start: item.start,
        stop: item.stop
      })
    })

    return programs
  }
}

function parseItems(content, channel, date) {
  const { programs } = parser.parse(content)

  return programs.filter(p => p.channel === channel.site_id && date.isSame(p.start, 'day'))
}
