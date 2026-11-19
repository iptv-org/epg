const parser = require('epg-parser')

module.exports = {
  site: 'redeimpactogospel.com',
  days: 2,
  url: 'https://redeimpactogospel.com/tv/epg.php',
  parser({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      programs.push({
        title: item.title?.[0]?.value,
        subTitle: item.subTitle?.[0]?.value,
        category: item.category?.[0]?.value,
        description: item.desc?.[0]?.value,
        start: item.start,
        stop: item.stop
      })
    })

    return programs
  },
  channels() {
    return [
      {
        name: 'Rede Impacto Gospel TV',
        site_id: 'RedeImpactoGospelTV.br',
        xmltv_id: 'RedeImpactoGospelTV.br',
        lang: 'pt'
      }
    ]
  }
}

function parseItems(content, channel, date) {
  const { programs } = parser.parse(content)

  return programs.filter(p => p.channel === channel.site_id && date.isSame(p.start, 'day'))
}
