const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0',
  'Referer': 'https://distro.tv/',
  'Origin': 'https://distro.tv'
}

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'distro.tv',
  days: 2,
  request: {
    headers: HEADERS
  },
  url({ channel }) {
    const days = module.exports.days || 2
    const hours = days * 24
    return `https://tv.jsrdn.com/epg/query.php?range=now,${hours}h&id=${channel.site_id},`
  },
  parser({ content, channel }) {
    if (!content || !channel) return []
    let programs = []
    try {
      const data = JSON.parse(content)
      if (!data.epg || !data.epg[channel.site_id] || !Array.isArray(data.epg[channel.site_id].slots)) {
        return []
      }
      programs = data.epg[channel.site_id].slots.map(program => ({
        title: program.title,
        description: program.description || null,
        icon: program.img_thumbh || null,
        start: dayjs.utc(program.start, 'YYYY-MM-DD HH:mm:ss'),
        stop: dayjs.utc(program.end, 'YYYY-MM-DD HH:mm:ss')
      }))
    } catch {
      return []
    }

    return programs.filter(p => p.title && p.start.isValid() && p.stop.isValid())
  },
  async channels() {
    const { data } = await axios.get('https://tv.jsrdn.com/tv_v5/getfeed.php?type=live', {
      headers: HEADERS
    })

    const channels = []
    if (data && data.shows) {
      Object.values(data.shows).forEach(show => {
        const episode = show.seasons?.[0]?.episodes?.[0]
        if (episode && episode.id) {
          channels.push({
            lang: 'en',
            // lang: show.language || 'en',
            site_id: episode.id.toString(),
            name: show.title,
            // logo: show.img_logo,
            // url: episode.content?.url || null
          })
        }
      })
    }

    return channels
  }
}