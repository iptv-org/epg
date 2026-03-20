const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'rts.ch',
  days: 2,

  url({ date }) {
    return `https://www.rts.ch/play/v3/api/rts/production/tv-program-guide?date=${date.format('YYYY-MM-DD')}`
  },

  parser({ content, channel }) {
    try {
      const { data } = JSON.parse(content)

      const channelData = data.find(entry => entry.channel.id === channel.site_id)
      if (!channelData || !Array.isArray(channelData.programList)) return []

      return channelData.programList.map(program => ({
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
    const { data: body } = await axios.get(
      `https://www.rts.ch/play/v3/api/rts/production/tv-program-guide?date=${today}`
    )
    return body.data.map(entry => ({
      site_id: entry.channel.id,
      name:    entry.channel.title,
      lang:    'fr',
    }))
  }
}