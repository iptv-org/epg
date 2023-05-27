const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const API_ENDPOINT = 'https://cds-frontend.vera.com.uy/api-contenidos'

module.exports = {
  site: 'tv.vera.com.uy',
  days: 2,
  async url({ date, channel }) {
    const session = await loadSessionDetails()
    if (!session || !session.token) return null

    return `${API_ENDPOINT}/canales/epg/${
      channel.site_id
    }?limit=500&dias_siguientes=0&fecha=${date.format('YYYY-MM-DD')}&token=${session.token}`
  },
  request: {
    async headers() {
      const session = await loadSessionDetails()
      if (!session || !session.jwt) return null

      return {
        authorization: `Bearer ${session.jwt}`,
        'x-frontend-id': 1196,
        'x-service-id': 3,
        'x-system-id': 1
      }
    }
  },
  parser({ content }) {
    let programs = []
    let items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.nombre_programa,
        sub_title: item.subtitle,
        description: item.descripcion_programa,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels({ lang }) {
    const session = await loadSessionDetails()
    if (!session || !session.jwt || !session.token) return null

    const data = await axios
      .get(`${API_ENDPOINT}/listas/68?token=${session.token}`, {
        headers: {
          authorization: `Bearer ${session.jwt}`,
          'x-frontend-id': 1196,
          'x-service-id': 3,
          'x-system-id': 1
        }
      })
      .then(r => r.data)
      .catch(console.error)

    return data.contenidos.map(c => {
      return {
        lang: 'es',
        site_id: c.public_id,
        name: c.nombre
      }
    })
  }
}

function parseStart(item) {
  return dayjs.tz(item.fecha_hora_inicio, 'YYYY-MM-DD HH:mm:ss', 'America/Montevideo')
}

function parseStop(item) {
  return dayjs.tz(item.fecha_hora_fin, 'YYYY-MM-DD HH:mm:ss', 'America/Montevideo')
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.data)) return []

  return data.data
}

function loadSessionDetails() {
  return axios
    .post(
      'https://veratv-be.vera.com.uy/api/sesiones',
      {
        tipo: 'anonima'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    .then(r => r.data)
    .catch(console.log)
}
