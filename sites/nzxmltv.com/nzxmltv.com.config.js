const parser = require('epg-parser')

module.exports = {
  site: 'nzxmltv.com',
  days: 2,
  request: {
    cache: {
      ttl: 3600000 // 1 hour
    },
    maxContentLength: 104857600 // 100 MB
  },
  url({ channel }) {
    const [path] = channel.site_id.split('#')

    return `https://nzxmltv.com/${path}.xml`
  },
  parser({ content, channel, date }) {
    const programs = []
    parseItems(content, channel, date).forEach(item => {
      const program = {
        title: item.title?.[0]?.value,
        description: item.desc?.[0]?.value,
        icon: item.icon?.[0]?.src,
        start: item.start,
        stop: item.stop
      }
      if (item.episodeNum) {
        item.episodeNum.forEach(ep => {
          if (ep.system === 'xmltv_ns') {
            const [season, episode] = ep.value.split('.')
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
  async channels({ provider }) {
    const axios = require('axios')
    const cheerio = require('cheerio')

    const providers = {
      freeview: 'xmltv/guide',
      sky: 'sky/guide',
      redbull: 'iptv/redbull',
      pluto: 'iptv/plutotv'
    }

    const channels = []
    const path = providers[provider]
    const xml = await axios
      .get(`https://nzxmltv.com/${path}.xml`)
      .then(r => r.data)
      .catch(console.error)

    const $ = cheerio.load(xml)
    $('tv channel').each((i, el) => {
      const disp = $(el).find('display-name')
      const channelId = $(el).attr('id')

      channels.push({
        lang: disp.attr('lang').substr(0, 2),
        site_id: `${path}#${channelId}`,
        name: disp.text().trim()
      })
    })

    return channels
  }
}

function parseItems(content, channel, date) {
  const { programs } = parser.parse(content)
  const [, channelId] = channel.site_id.split('#')

  return programs.filter(p => p.channel === channelId && date.isSame(p.start, 'day'))
}
