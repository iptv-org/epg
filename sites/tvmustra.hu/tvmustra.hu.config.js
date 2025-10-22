const cheerio = require('cheerio')
const axios = require('axios')
const { DateTime } = require('luxon')

module.exports = {
  site: 'tvmustra.hu',
  days: 2,
  url({ channel, date }) {
    return `https://www.tvmustra.hu/tvmusor/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (!start) return
      if (prev) {
        if (start < prev.start) {
          start = start.plus({ days: 1 })
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.plus({ minute: 30 })

      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const html = await axios
      .get('https://www.tvmustra.hu/')
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(html)
    const items = $('.channel-selector option').toArray()

    const channels = []
    items.forEach(item => {
      const name = $(item).text().trim()
      const site_id = $(item).attr('value').trim()
      if (!site_id) return

      channels.push({
        lang: 'hu',
        site_id,
        name
      })
    })

    return channels
  }
}

function parseTitle($item) {
  return $item('.musor_lista_cim, .musor_lista_cim2').text().trim()
}

function parseStart($item, date) {
  const time = $item('.musor_lista_idopont, .musor_lista_idopont2').text().trim()

  return DateTime.fromFormat(`${date.format('YYYY-MM-DD')} ${time}`, 'yyyy-MM-dd HH:mm', {
    zone: 'Europe/Budapest'
  }).toUTC()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#epg-container > div:nth-child(4) > div.col-6_sor3 > div.showtime').toArray()
}
