const { DateTime } = require('luxon')

module.exports = {
  site: 'movistarplus.es',
  days: 2,
  url: function ({ date }) {
    return `https://www.movistarplus.es/programacion-tv/${date.format('YYYY-MM-DD')}?v=json`
  },
  parser({ content, channel, date }) {
    let programs = []
    let items = parseItems(content, channel)
    if (!items.length) return programs
    let guideDate = date
    items.forEach(item => {
      let startTime = DateTime.fromFormat(
        `${guideDate.format('YYYY-MM-DD')} ${item.HORA_INICIO}`,
        'yyyy-MM-dd HH:mm',
        {
          zone: 'Europe/Madrid'
        }
      ).toUTC()
      let stopTime = DateTime.fromFormat(
        `${guideDate.format('YYYY-MM-DD')} ${item.HORA_FIN}`,
        'yyyy-MM-dd HH:mm',
        {
          zone: 'Europe/Madrid'
        }
      ).toUTC()
      if (stopTime < startTime) {
        guideDate = guideDate.add(1, 'd')
        stopTime = stopTime.plus({ days: 1 })
      }
      programs.push({
        title: item.TITULO,
        category: item.GENERO,
        start: startTime,
        stop: stopTime
      })
    })
    return programs
  },
  async channels() {
    const axios = require('axios')
    const dayjs = require('dayjs')
    const data = await axios
      .get(`https://www.movistarplus.es/programacion-tv/${dayjs().format('YYYY-MM-DD')}?v=json`)
      .then(r => r.data)
      .catch(console.log)

    return Object.values(data.data).map(item => {
      return {
        lang: 'es',
        site_id: item.DATOS_CADENA.CODIGO,
        name: item.DATOS_CADENA.NOMBRE
      }
    })
  }
}

function parseItems(content, channel) {
  const json = typeof content === 'string' ? JSON.parse(content) : content
  if (!(`${channel.site_id}-CODE` in json.data)) return []
  const data = json.data[`${channel.site_id}-CODE`]
  return data ? data.PROGRAMAS : []
}
