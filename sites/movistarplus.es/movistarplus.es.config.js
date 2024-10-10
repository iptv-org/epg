const { DateTime } = require('luxon')

const API_PROD_ENDPOINT = 'https://www.movistarplus.es/programacion-tv'
const API_IMAGE_ENDPOINT = 'https://www.movistarplus.es/recorte/n/caratulaH/';

module.exports = {
  site: 'movistarplus.es',
  days: 2,
  url: function ({ date }) {
    return `${API_PROD_ENDPOINT}/${date.format('YYYY-MM-DD')}?v=json`
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
        icon: parseIcon(item, channel),
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
      .get(`${API_PROD_ENDPOINT}/${dayjs().format('YYYY-MM-DD')}?v=json`)
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

function parseIcon(item, channel) {
  return `${API_IMAGE_ENDPOINT}/M${channel.site_id}P${item.ELEMENTO}`;
}

function parseItems(content, channel) {
  const json = typeof content === 'string' ? JSON.parse(content) : content
  if (!(`${channel.site_id}-CODE` in json.data)) return []
  const data = json.data[`${channel.site_id}-CODE`]
  return data ? data.PROGRAMAS : []
}
