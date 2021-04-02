const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  lang: 'es',
  site: 'programacion-tv.elpais.com',
  channels: 'programacion-tv.elpais.com.channels.xml',
  output: '.gh-pages/guides/programacion-tv.elpais.com.guide.xml',
  url: function ({ date }) {
    return `https://programacion-tv.elpais.com/data/parrilla_${date.format('DDMMYYYY')}.json`
  },
  logo: function ({ channel }) {
    return `https://programacion-tv.elpais.com/imagenes/canales/${channel.site_id}.jpg`
  },
  parser: function ({ content, date, channel }) {
    const programs = []
    const data = JSON.parse(content)
    const channelData = data.find(i => i.idCanal === channel.site_id)
    if (!channelData) return programs
    channelData.programas.forEach(item => {
      if (item.title && item.iniDate && item.endDate) {
        const start = dayjs.utc(item.iniDate).toString()
        const stop = dayjs.utc(item.endDate).toString()
        programs.push({
          title: item.title,
          description: item.description,
          category: item.txtSection,
          start,
          stop
        })
      }
    })

    return programs
  }
}
