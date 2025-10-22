const axios = require('axios')
const iconv = require('iconv-lite')
const parser = require('epg-parser')
const { ungzip } = require('pako')
const zlib = require('zlib')
const sax = require('sax')

let cachedContent

module.exports = {
  site: 'epgshare01.online',
  days: 2,
  url({ channel }) {
    const [tag] = channel.site_id.split('#')

    return `https://epgshare01.online/epgshare01/epg_ripper_${tag}.xml.gz`
  },
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    },
    maxContentLength: 100000000 // 100 MB
  },
  parser({ buffer, channel, date, cached }) {
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
  async channels({ tag }) {
    const url = `https://epgshare01.online/epgshare01/epg_ripper_${tag}.xml.gz`
    try {
      const res = await axios.get(url, { responseType: 'stream' })

      const parserStream = sax.createStream(true, { trim: true })
      const channels = []
      let current = null
      let curText = ''
      let curTag = null

      parserStream.on('opentag', node => {
        const name = node.name.toLowerCase()
        if (name === 'channel') {
          current = { id: node.attributes.id || node.attributes.ID, displayName: [] }
        } else if (current && (name === 'display-name' || name === 'displayname')) {
          curTag = 'displayName'
          curText = ''
          // capture possible lang attribute (xml:lang or lang)
          current._lang =
            node.attributes['xml:lang'] || node.attributes['xml:Lang'] || node.attributes.lang
        }
      })

      parserStream.on('text', text => {
        if (curTag === 'displayName') curText += text
      })

      parserStream.on('cdata', text => {
        if (curTag === 'displayName') curText += text
      })

      parserStream.on('closetag', nameRaw => {
        const name = nameRaw.toLowerCase()
        if (current && (name === 'display-name' || name === 'displayname')) {
          current.displayName.push({
            lang: current._lang || 'en',
            value: curText.trim()
          })
          curTag = null
          curText = ''
          current._lang = undefined
        } else if (name === 'channel' && current) {
          channels.push({ id: current.id, displayName: current.displayName })
          current = null
        }
      })

      await new Promise((resolve, reject) => {
        res.data.pipe(zlib.createGunzip()).pipe(parserStream).on('end', resolve).on('error', reject)
      })

      return channels.map(channel => {
        const displayName = (channel.displayName && channel.displayName[0]) || {
          lang: 'en',
          value: channel.id
        }
        return {
          lang: displayName.lang || 'en',
          site_id: `${tag}#${channel.id}`,
          name: displayName.value
        }
      })
    } catch (err) {
      console.error(err)
      return []
    }
  }
}

function parseItems(buffer, channel, date) {
  if (!buffer) return []

  if (!cachedContent) {
    const content = ungzip(buffer)
    const encoded = iconv.decode(content, 'utf8')
    cachedContent = parser.parse(encoded)
  }

  const { programs } = cachedContent
  const [, channelId] = channel.site_id.split('#')

  return programs.filter(p => p.channel === channelId && date.isSame(p.start, 'day'))
}
