const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)

require('dayjs/locale/pt')

module.exports = {
  site: 'guiadetv.com',
  days: 2,
  url({ channel }) {
    return `https://www.guiadetv.com/canal/${channel.site_id}`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      const title = parseTitle($item)
      let start = parseStart($item)
      if (!start || !title) return
      if (prev) {
        prev.stop = start
      }
      const stop = start.add(30, 'm')

      programs.push({
        title,
        description: parseDescription($item),
        category: parseCategory($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const categories = [
      'variedades',
      'tv-aberta',
      'noticias',
      'infantil',
      'filmes-e-series',
      'esportes',
      'documentarios'
    ]
    const promises = categories.map(category =>
      axios.get(`https://www.guiadetv.com/categorias/${category}.html`)
    )

    const channels = []
    const results = await Promise.all(promises).catch(console.log)
    results.forEach(r => {
      const $ = cheerio.load(r.data)
      $('.cardchannel').each((i, el) => {
        const link = $(el).find('a')
        const name = link.attr('title')
        const url = link.attr('href')
        const site_id = url.replace('https://www.guiadetv.com/canal/', '')

        channels.push({
          lang: 'pt',
          name,
          site_id
        })
      })
    })

    return channels
  }
}

function parseTitle($item) {
  return $item('h3').text().trim()
}

function parseDescription($item) {
  return $item('p').clone().children().remove().end().text().trim() || null
}

function parseCategory($item) {
  return $item('p > i').text().trim() || null
}

function parseStart($item) {
  const dt = $item('b span:nth-child(1)').data('dt') || $item('b').data('dt')
  if (!dt) return null

  return dayjs(dt, 'YYYY-MM-DD HH:mm:ssZ')
}

function parseItems(content, date) {
  const $ = cheerio.load(content)
  const localDate = date.locale('pt').format('D MMMM YYYY')

  return $(`.row:contains(${localDate})`).nextUntil('.row:not(.mt-1)').toArray()
}
