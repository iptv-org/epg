const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')

module.exports = {
  site: 'movistarplus.es',
  days: 2,
  url({ channel, date }) {
    return `https://www.movistarplus.es/programacion-tv/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  async parser({ content }) {
    let programs = []
    let items = parseItems(content)
    if (!items.length) return programs

    const $ = cheerio.load(content)
    const programDivs = $('div[id^="ele-"]').toArray()

    const headers = {
      'Referer': 'https://comunicacion.movistarplus.es/programacion-tv/',
      'Origin': 'https://comunicacion.movistarplus.es',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    for (let i = 0; i < items.length; i++) {
      const el = items[i]
      let programDescription = ''
      let programId = ''

      try {
        if (programDivs[i]) {
          programId = programDivs[i].attribs.id.replace('ele-', '')
          
          const descUrl = `https://comunicacion.movistarplus.es/detalle-de-programacion/?cee=${programId}`
          const response = await axios.get(descUrl, {
            headers: headers,
            timeout: 5000
          })
          
          const $desc = cheerio.load(response.data)
          programDescription = $desc('div.program-details div.sinopsis div.sinopsis_large').text().trim() || 
                             $desc('div.sinopsis_large').text().trim()
        }
      } catch (error) {
        continue
      }

      programs.push({
        title: el.item.name,
        start: dayjs(el.item.startDate),
        stop: dayjs(el.item.endDate),
        description: programDescription
      })
    }

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
