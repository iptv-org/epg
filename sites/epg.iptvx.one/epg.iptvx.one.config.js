const axios = require('axios')
const iconv = require('iconv-lite')
const parser = require('epg-parser')
const pako = require('pako')

let cachedContent

module.exports = {
  site: 'epg.iptvx.one',
  days: 2,
  url: 'https://iptvx.one/epg/epg_noarch.xml.gz',
  request: {
    maxContentLength: 500000000, // 500 MB
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  parser: function ({ buffer, channel, date, cached }) {
    if (!cached) cachedContent = undefined

    let programs = []
    const items = parseItems(buffer, channel, date)
    items.forEach(item => {
      programs.push({
        title: item.title?.[0]?.value,
        description: item.desc?.[0]?.value,
        start: item.start,
        stop: item.stop
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get('https://epg.iptvx.one/api/channels.json')
      .then(r => r.data)
      .catch(console.log)

    return data.channels.map(channel => {
      const [name] = channel.chan_names.split(' • ')

      return {
        lang: 'ru',
        site_id: channel.chan_id,
        name
      }
    })
  }
}

function parseItems(buffer, channel, date) {
  if (!buffer) return []

  if (!cachedContent) {
    const content = pako.ungzip(buffer)
    const encoded = iconv.decode(content, 'utf8')
    cachedContent = parser.parse(encoded)
  }

  const { programs } = cachedContent

  return programs.filter(p => p.channel === channel.site_id && date.isSame(p.start, 'day'))
}
