const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'rts.ch',
  days: 2,

  url({ channel, date }) {
    return `https://il.srgssr.ch/integrationlayer/2.0/rts/programGuide/tv/byDate/${date.format('YYYY-MM-DD')}?reduced=false&channelId=${channel.site_id}`
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
    const { data } = await axios.get(
      `https://www.rts.ch/play/v3/api/rts/production/tv-program-guide?date=${today}`
    )
    return data.data.map(entry => ({
      site_id: entry.channel.id,
      name:    entry.channel.title,
      lang:    'fr',
    }))
  }
}