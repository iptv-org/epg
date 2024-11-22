const { DateTime } = require('luxon')

const API_CHANNEL_ENDPOINT = 'https://www.movistarplus.es/programacion-tv'
const API_PROGRAM_ENDPOINT = 'https://comunicacion.movistarplus.es'
const API_IMAGE_ENDPOINT = 'https://www.movistarplus.es/recorte/n/caratulaH/';

module.exports = {
  site: 'movistarplus.es',
  days: 2,
  url: function ({ channel, date }) {
    return `${API_PROGRAM_ENDPOINT}/wp-admin/admin-ajax.php`
  },
  request: {
    method: 'POST',
    headers: {
      Origin: API_PROGRAM_ENDPOINT,
      Referer: `${API_PROGRAM_ENDPOINT}/programacion/`,
      "Content-Type" : 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    data: function ({ channel, date }) {
      return {
        action: 'getProgramation',
        day: date.format('YYYY-MM-DD'),
        "channels[]": channel.site_id
      }
    }
  },
  parser({ content, channel, date }) {
    let programs = []
    let items = parseItems(content, channel)
    if (!items.length) return programs
    let guideDate = date

    items.forEach(item => {
      let startTime = DateTime.fromFormat(
        `${item.f_evento_rejilla}`,
        'yyyy-MM-dd HH:mm:ss',
        {
          zone: 'Europe/Madrid'
        }
      ).toUTC()
      let stopTime = DateTime.fromFormat(
        `${item.f_fin_evento_rejilla}`,
        'yyyy-MM-dd HH:mm:ss',
        {
          zone: 'Europe/Madrid'
        }
      ).toUTC()
      if (stopTime < startTime) {
        guideDate = guideDate.add(1, 'd')
        stopTime = stopTime.plus({ days: 1 })
      }
      programs.push({
        title: item.des_evento_rejilla,
        icon: parseIcon(item, channel),
        category: item.des_genero,
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
  const data = json.channelsProgram;

  if(data.length != 1)
    return []
  return data[0];
}
