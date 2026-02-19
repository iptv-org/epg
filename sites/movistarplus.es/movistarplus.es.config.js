const axios = require('axios')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Europe/Madrid')

module.exports = {
  site: 'movistarplus.es',
  days: 2,
  url({ channel, date }) {
    return `https://ottcache.dof6.com/movistarplus/webplayer/OTT/epg?from=${date.format('YYYY-MM-DDTHH:mm:ss')}&span=1&channel=${channel.site_id}&version=8&mdrm=true&tlsstream=true&demarcation=18`
  },
  async parser({ content }) {
    let programs = []
    let items = await parseItems(content)
    if (!items.length) return programs

    items.forEach(el => {
      programs.push({
          title: el.title,
          description: el.description,
          season: el.season,
          episode: el.episode,
          start: el.start,
          stop: el.stop
        })
      })
    return programs

  },
  async channels() {
    const json = await axios
      .get('https://ottcache.dof6.com/movistarplus/webplayer/OTT/contents/channels?mdrm=true&tlsstream=true&demarcation=18&version=8')
      .then(r => r.data)
      .catch(console.log)

    // Load JSON, CodCadenaTv is the closest to the old MVSTR site ch. ID
    return json.map(channel => {
      return {
        lang: 'es',
        site_id: channel.CodCadenaTv,
        name: channel.Nombre,
        logo: channel.Logo ? channel.Logos[0].url : null
      }
    })
  }
}

async function parseItems(content) {
  try {
    const data = JSON.parse(content)
    const programs = Array.isArray(data) ? data : [data]
    return await Promise.all(programs.map(async (json) => {
      const start = dayjs.utc(Number(json?.FechaHoraInicio))
      const stop = dayjs.utc(Number(json?.FechaHoraFin))
      const ficha = json?.Ficha || null
      if (!ficha) {
        return {
          title: json?.Titulo || '',
          description: json?.Resena || '',
          start,
          stop
        }
      } else {
        try {
          const fichaJson = await axios.get(ficha).then(r => r.data)
          return {
            title: json?.Titulo || fichaJson?.Titulo || '',
            description: fichaJson?.Descripcion || json?.Resena || '',
            actors: fichaJson?.Actores || [],
            directors: fichaJson?.Directores || [],
            classification: fichaJson?.Clasificacion || '',
            season: fichaJson?.Temporada || null,
            episode: fichaJson?.NumeroEpisodio || null,
            start,
            stop
          }
        } catch {
          return {
            title: json?.Titulo || '',
            description: json?.Resena || '',
            start,
            stop
          }
        }
      }
    }))
  } catch {
    return []
  }
}