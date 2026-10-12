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

  // The file unpacks to ~400MB of XML, and parsing all of it at once runs the grabber out of
  // memory. Keep it as a Buffer (outside the JS heap), index each <programme> element's byte
  // range by channel once, and parse only the requested channel's.
  if (!cachedContent) cachedContent = indexProgrammes(Buffer.from(pako.ungzip(buffer)))

  const { xml, byChannel } = cachedContent
  const ranges = byChannel.get(channel.site_id)
  if (!ranges) return []

  const elements = ranges.map(([start, end]) => iconv.decode(xml.subarray(start, end), 'utf8'))
  const { programs } = parser.parse(`<tv>${elements.join('')}</tv>`)

  return programs.filter(p => p.channel === channel.site_id && date.isSame(p.start, 'day'))
}

function indexProgrammes(xml) {
  const byChannel = new Map()
  let start = xml.indexOf('<programme')
  while (start !== -1) {
    const tagEnd = xml.indexOf('>', start)
    if (tagEnd === -1) break
    const tag = xml.toString('utf8', start, tagEnd + 1)
    let end = tagEnd + 1
    if (!tag.endsWith('/>')) {
      const close = xml.indexOf('</programme>', tagEnd)
      if (close === -1) break
      end = close + '</programme>'.length
    }
    const match = tag.match(/\bchannel="([^"]*)"/)
    if (match) {
      if (!byChannel.has(match[1])) byChannel.set(match[1], [])
      byChannel.get(match[1]).push([start, end])
    }
    start = xml.indexOf('<programme', end)
  }

  return { xml, byChannel }
}
