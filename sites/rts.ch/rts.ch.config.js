const axios = require('axios')
const dayjs = require('dayjs')

const LANG_BY_VENDOR = {
  RTS: 'fr',
  SRF: 'de',
  RSI: 'it',
  RTR: 'rm',
}

const CHANNELS_APIS = [
  'https://www.rts.ch/play/v3/api/rts/production/tv-program-guide',
  'https://www.srf.ch/play/v3/api/srf/production/tv-program-guide',
  'https://www.rsi.ch/play/v3/api/rsi/production/tv-program-guide',
]

module.exports = {
  site: 'rts.ch',
  days: 2,

  url({ channel, date }) {
    const vendor = channel.site_id.split('|')[0].toLowerCase()
    const channelId = channel.site_id.split('|')[1]
    return `https://il.srgssr.ch/integrationlayer/2.0/${vendor}/programGuide/tv/byDate/${date.format('YYYY-MM-DD')}?reduced=false&channelId=${channelId}`
  },

  parser({ content }) {
    try {
      const { programGuide } = JSON.parse(content)
      if (!programGuide?.[0]?.programList) return []

      return programGuide[0].programList.map(program => ({
        title:       program.title || '',
        subTitle:    program.subtitle || undefined,
        description: program.description || program.show?.description || undefined,
        start:       new Date(program.startTime).toISOString(),
        stop:        new Date(program.endTime).toISOString(),
        icon:        program.imageUrl ? { src: program.imageUrl } : undefined,
        category:    program.genre || undefined,
      }))
    } catch {
      return []
    }
  },

  async channels() {
    const today = dayjs().format('YYYY-MM-DD')
    const results = []

    for (const apiUrl of CHANNELS_APIS) {
      try {
        const { data } = await axios.get(`${apiUrl}?date=${today}`)
        for (const entry of data.data) {
          const vendor = entry.channel.vendor  // e.g. "RTS", "SRF"
          results.push({
            site_id: `${vendor}|${entry.channel.id}`,
            name:    entry.channel.title,
            lang:    LANG_BY_VENDOR[vendor] || 'fr',
          })
        }
      } catch {
        // skip unavailable sources
      }
    }

    return results
  }
}