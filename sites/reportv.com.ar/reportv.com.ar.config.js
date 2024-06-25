require('dayjs/locale/es')
const axios = require('axios')
const dayjs = require('dayjs')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'reportv.com.ar',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    },
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data({ channel, date }) {
      const formData = new URLSearchParams()
      formData.append('idSenial', channel.site_id)
      formData.append('Alineacion', '2694')
      formData.append('DiaDesde', date.format('YYYY/MM/DD'))
      formData.append('HoraDesde', '00:00:00')

      return formData
    }
  },
  url: 'https://www.reportv.com.ar/buscador/ProgXSenial.php',
  parser: async function ({ content, date }) {
    let programs = []
    const items = parseItems(content, date)
    for (let item of items) {
      const $item = cheerio.load(item)
      const start = parseStart($item, date)
      const duration = parseDuration($item)
      const stop = start.add(duration, 's')
      const details = await loadProgramDetails($item)
      programs.push({
        title: parseTitle($item),
        category: parseCategory($item),
        icon: details.icon,
        description: details.description,
        directors: details.directors,
        actors: details.actors,
        start,
        stop
      })
    }

    return programs
  },
  async channels() {
    const content = await axios
      .get('https://www.reportv.com.ar/buscador/Buscador.php?aid=2694')
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(content)
    const items = $('#tr_home_2 > td:nth-child(1) > select > option').toArray()

    return items.map(item => {
      return {
        lang: 'es',
        site_id: $(item).attr('value'),
        name: $(item).text()
      }
    })
  }
}

async function loadProgramDetails($item) {
  const onclick = $item('*').attr('onclick')
  const regexp = /detallePrograma\((\d+),(\d+),(\d+),(\d+),'([^']+)'\);/g
  const match = [...onclick.matchAll(regexp)]
  const [, id, idc, id_alineacion, idp, title] = match[0]
  if (!id || !idc || !id_alineacion || !idp || !title) return Promise.resolve({})
  const formData = new URLSearchParams()
  formData.append('id', id)
  formData.append('idc', idc)
  formData.append('id_alineacion', id_alineacion)
  formData.append('idp', idp)
  formData.append('title', title)
  const content = await axios
    .post('https://www.reportv.com.ar/buscador/DetallePrograma.php', formData)
    .then(r => r.data.toString())
    .catch(console.error)
  if (!content) return Promise.resolve({})

  const $ = cheerio.load(content)

  return Promise.resolve({
    icon: parseIcon($),
    actors: parseActors($),
    directors: parseDirectors($),
    description: parseDescription($)
  })
}

function parseActors($) {
  const section = $('#Ficha > div')
    .html()
    .split('<br>')
    .find(str => str.includes('Actores:'))
  if (!section) return null
  const $section = cheerio.load(section)

  return $section('span')
    .map((i, el) => $(el).text().trim())
    .get()
}

function parseDirectors($) {
  const section = $('#Ficha > div')
    .html()
    .split('<br>')
    .find(str => str.includes('Directores:'))
  if (!section) return null
  const $section = cheerio.load(section)

  return $section('span')
    .map((i, el) => $(el).text().trim())
    .get()
}

function parseDescription($) {
  return $('#Sinopsis > div').text().trim()
}

function parseIcon($) {
  const src = $('#ImgProg').attr('src')
  const url = new URL(src, 'https://www.reportv.com.ar/buscador/')

  return url.href
}

function parseTitle($item) {
  const [, title] = $item('div:nth-child(1) > span').text().split(' - ')

  return title
}

function parseCategory($item) {
  return $item('div:nth-child(3) > span').text()
}

function parseStart($item, date) {
  const [time] = $item('div:nth-child(1) > span').text().split(' - ')

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'America/Caracas')
}

function parseDuration($item) {
  const [hh, mm, ss] = $item('div:nth-child(4) > span').text().split(':')

  return parseInt(hh) * 3600 + parseInt(mm) * 60 + parseInt(ss)
}

function parseItems(content, date) {
  if (!content) return []
  const $ = cheerio.load(content)
  const d = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'long', year: 'numeric' })
  .format(new Date()).replace(/\b\w/g, char => char.toUpperCase());

  return $(`.trProg[title*="${d}"]`).toArray()
}
