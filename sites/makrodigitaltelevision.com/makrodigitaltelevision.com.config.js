const parser = require('epg-parser')

module.exports = {
  site: 'makrodigitaltelevision.com',
  days: 3,
  url: 'https://makrodigitaltelevision.com/epg.xml',
  parser({ content, date, channel }) {
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
  }
}

function parseItems(content, channel, date) {
  const { programs } = parser.parse(content)

  return programs.filter(p => p.channel === channel.site_id && date.isSame(p.start, 'day'))
}
