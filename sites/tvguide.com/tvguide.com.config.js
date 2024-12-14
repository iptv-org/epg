const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const fs = require('fs')
const xml2js = require('xml2js')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'tvguide.com',
  days: 2,  // Número de días que deseas
  url: function ({ date, channel }) {
    const [providerId, channelSourceIds] = channel.site_id.split('##');
    
    // `start` es la fecha actual, y `duration` sigue siendo 20160 (14 días)
    const url = `https://backend.tvguide.com/v1/xapi/tvschedules/tvguide/${providerId}/web?start=${date.startOf('d').unix()}&duration=20160&channelSourceIds=${channelSourceIds}&apiKey=${API_KEY}`;
    
    return url;
  },

  async parser({ content }) {
    const programs = []
    const items = parseItems(content)

    // Obtener la fecha de inicio del filtro
    const endDate = dayjs().add(this.days, 'day');  // Fecha de fin ajustada por el número de días

    for (let item of items) {
      const itemData = await loadProgramItem(item)

      // Filtramos los programas solo para los días que queremos
      const startDate = dayjs.unix(item.startTime);
      if (startDate.isBefore(endDate)) {
        programs.push({
          title: item.title,
          date: extractYear(itemData),
          description: itemData.description,
          season: getSeasonNumber(itemData),
          episode: getEpisodeNumber(itemData),
          rating: parseRating(item),
          categories: parseCategories(itemData),
          start: parseTime(item.startTime),
          stop: parseTime(item.endTime)
        })
      }
    }

    return programs;
  },
  async channels() {
    const configPath = process.argv.find(arg => arg.startsWith('--channels='))?.split('=')[1]

    if (!configPath) {
      throw new Error('No se proporcionó la ruta del archivo de configuración.')
    }

    const providers = await getProvidersFromConfig(configPath)

    let channels = []
    for (let provider of providers) {
      const data = await axios
        .get(
          `https://backend.tvguide.com//v1/xapi/tvschedules/tvguide/serviceprovider/${provider.id}/sources/web`
        )
        .then(r => r.data)
        .catch(console.log)

      data.data.items.forEach(item => {
        channels.push({
          lang: 'en',
          site_id: `${provider.id}##${item.sourceId}`,
          name: item.fullName
        })
      })
    }

    return channels
  }
}

// Funciones para capturar los datos del item

function getReleaseYear(item) {
  return item.releaseYear || ''
}

function getEpisodeNumber(item) {
  return item.episodeNumber || ''
}

function getSeasonNumber(item) {
  return item.seasonNumber || ''
}

// Otras funciones

function parseRating(item) {
  return item.rating ? { system: 'MPA', value: item.rating } : null
}

function parseCategories(item) {
  return Array.isArray(item.genres) ? item.genres.map(g => g.name) : []
}

function parseTime(timestamp) {
  return dayjs.unix(timestamp)
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data.data || !Array.isArray(data.data.items) || !data.data.items.length) return []

  return data.data.items[0].programSchedules
}

async function loadProgramItem(item) {
  item.programDetails = item.programDetails.replace('player1-backend-prod-internal.apigee.net', 'backend.tvguide.com')
  const data = await axios
    .get(item.programDetails)
    .then(r => r.data)
    .catch(err => {
      console.log(err.message)
    })
  if (!data || !data.data || !data.data.item) return {}

  return data.data.item
}

async function getProvidersFromConfig(configPath) {
  const xmlData = fs.readFileSync(configPath, 'utf-8')
  const parser = new xml2js.Parser()
  const result = await parser.parseStringPromise(xmlData)

  const channels = result.channels.channel || []
  const providerIds = new Set()

  channels.forEach(channel => {
    const siteId = channel.$.site_id
    const [providerId] = siteId.split('##')
    providerIds.add(providerId)
  })

  return Array.from(providerIds).map(id => ({ id }))
}

// Función para extraer el año correctamente
function extractYear(item) {
  // Usa el campo releaseYear si está disponible
  const year = item.releaseYear ? item.releaseYear.toString() : '';
  return /^[0-9]{4}$/.test(year) ? year : ''; // Asegura que el año tenga 4 dígitos
}
