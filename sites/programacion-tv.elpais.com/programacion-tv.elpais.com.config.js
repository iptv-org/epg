const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'programacion-tv.elpais.com',
  url: function ({ date }) {
    return `https://programacion-tv.elpais.com/data/parrilla_${date.format('DDMMYYYY')}.json`
  },
  parser: function ({ content, date, channel }) {
    const programs = []
    const data = JSON.parse(content)
    const channelData = data.find(i => i.idCanal === channel.site_id)
    if (!channelData) return programs
    channelData.programas.forEach(item => {
      if (item.title && item.iniDate && item.endDate) {
        const startLocal = dayjs.utc(item.iniDate).toString()
        const start = dayjs.tz(startLocal.toString(), 'Europe/Madrid')
        const stopLocal = dayjs.utc(item.endDate).toString()
        const stop = dayjs.tz(stopLocal.toString(), 'Europe/Madrid')
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
