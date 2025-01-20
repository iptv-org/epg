const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')

module.exports = {
  site: 'movistarplus.es',
  days: 2,
  url({ channel, date }) {
    return `https://www.movistarplus.es/programacion-tv/${channel.site_id}/${date.format(
      'YYYY-MM-DD'
    )}`
  },
  parser({ content }) {
    let programs = []
    let items = parseItems(content)
    if (!items.length) return programs
    items.forEach(el => {
      programs.push({
        title: el.item.name,
        start: dayjs(el.item.startDate),
        stop: dayjs(el.item.endDate)
      })
    })
    return programs
  },
  async channels() {
    const html = await axios
      .get('https://www.movistarplus.es/programacion-tv')
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(html)
    let scheme = $('script:contains(ItemList)').html()
    scheme = JSON.parse(scheme)

    return scheme.itemListElement.map(el => {
      const urlParts = el.item.url.split('/')
      const site_id = urlParts.pop().toLowerCase()

      return {
        lang: 'es',
        name: el.item.name,
        site_id
      }
    })
  }
}

function parseItems(content) {
  try {
    const $ = cheerio.load(content)
    let scheme = $('script:contains("@type": "ItemList")').html()
    scheme = JSON.parse(scheme)
    if (!scheme || !Array.isArray(scheme.itemListElement)) return []

    return scheme.itemListElement
  } catch {
    return []
  }
}
