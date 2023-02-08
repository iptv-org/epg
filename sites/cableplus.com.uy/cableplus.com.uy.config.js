const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const API_ENDPOINT = 'https://www.reportv.com.ar/finder'

module.exports = {
  site: 'cableplus.com.uy',
  days: 2,
  url: `${API_ENDPOINT}/channel`,
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    data({ date, channel }) {
      const params = new URLSearchParams()
      params.append('idAlineacion', '3017')
      params.append('idSenial', channel.site_id)
      params.append('fecha', date.format('YYYY-MM-DD'))
      params.append('hora', '00:00')

      return params
    }
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(30, 'm')
      programs.push({
        title: parseTitle($item),
        categories: parseCategories($item),
        icon: parseIcon($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const params = new URLSearchParams({ idAlineacion: '3017' })
    const data = await axios
      .post(`${API_ENDPOINT}/channelGrid`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
      })
      .then(r => r.data)
      .catch(console.error)
    const $ = cheerio.load(data)

    return $('.senial')
      .map(function () {
        return {
          lang: 'es',
          site_id: $(this).attr('id'),
          name: $(this).find('img').attr('alt')
        }
      })
      .get()
  }
}

function parseTitle($item) {
  return $item('p.evento_titulo.texto_a_continuacion.dotdotdot,.programa-titulo > span:first-child')
    .text()
    .trim()
}

function parseIcon($item) {
  return $item('img').data('src') || $item('img').attr('src') || null
}

function parseCategories($item) {
  return $item('p.evento_genero')
    .map(function () {
      return $item(this).text().trim()
    })
    .toArray()
}

function parseStart($item, date) {
  let time = $item('.grid_fecha_hora').text().trim()

  if (time) {
    return dayjs.tz(`${date.format('YYYY')} ${time}`, 'YYYY DD-MM HH:mm[hs.]', 'America/Montevideo')
  }

  time = $item('.fechaHora').text().trim()

  return time
    ? dayjs.tz(`${date.format('YYYY')} ${time}`, 'YYYY DD/MM HH:mm[hs.]', 'America/Montevideo')
    : null
}

function parseItems(content, date) {
  const $ = cheerio.load(content)

  let featuredItems = $('.vista-pc > .programacion-fila > .channel-programa')
    .filter(function () {
      return $(this).find(`.grid_fecha_hora`).text().indexOf(date.format('DD-MM')) > -1
    })
    .toArray()
  let otherItems = $(`#owl-pc > .item-program`)
    .filter(function () {
      return (
        $(this)
          .find(`.evento_titulo > .horario > p.fechaHora`)
          .text()
          .indexOf(date.format('DD/MM')) > -1
      )
    })
    .toArray()

  return featuredItems.concat(otherItems)
}
