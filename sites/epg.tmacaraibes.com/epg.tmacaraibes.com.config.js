const parser = require('epg-parser')

module.exports = {
  site: 'epg.tmacaraibes.com',
  days: 2,
  url: 'https://epg.tmacaraibes.com/Epg/xmltv.xml',
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.desc,
        icon: item.icon,
        category: item.category,
        ratings: item.rating,
        length: item.length,
        start: item.start,
        stop: item.stop
      })
    })

    return programs
  },
  channels() {
    return [
      {
        name: 'TMA',
        site_id: 'TMA.gp@SD',
        lang: 'fr',
        xmltv_id: 'TMA.gp@SD'
      }
    ]
  }
}

function parseItems(content, channel, date) {
  const { programs } = parser.parse(content)

  return programs.filter(p => p.channel === channel.site_id && date.isSame(p.start, 'day'))
}
