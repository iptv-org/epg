const parser = require('epg-parser')

module.exports = {
  site: 'nzxmltv.com',
  days: 2,
  request: {
    cache: {
      ttl: 3600000 // 1 hour
    },
    maxContentLength: 10485760 // 10 MB
  },
  url: 'https://nzxmltv.com/xmltv/guide.xml',
  parser({ content, channel, date }) {
    const programs = []
    parseItems(content, channel, date).forEach(item => {
      const program = {
        title: item.title?.[0]?.value,
        description: item.desc?.[0]?.value,
        icon: item.icon?.[0],
        start: item.start,
        stop: item.stop
      }
      if (item.episodeNum) {
        item.episodeNum.forEach(ep => {
          if (ep.system === 'xmltv_ns') {
            const [season, episode, _] = ep.value.split('.')
            program.season = parseInt(season) + 1
            program.episode = parseInt(episode) + 1
            return true
          }
        })
      }
      programs.push(program)
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const cheerio = require('cheerio')
    const xml = await axios
      .get('https://nzxmltv.com/xmltv/guide.xml')
      .then(r => r.data)
      .catch(console.error)

    const channels = []
    const $ = cheerio.load(xml)
    $('tv channel').each((i, el) => {
      const disp = $(el).find('display-name')
      channels.push({
        lang: disp.attr('lang').substr(0, 2),
        site_id: $(el).attr('id'),
        name: disp.text().trim()
      })
    })

    return channels
  }
}

function parseItems(content, channel, date) {
  const { programs } = parser.parse(content)

  return programs.filter(p => p.channel === channel.site_id && date.isSame(p.start, 'day'))
}
