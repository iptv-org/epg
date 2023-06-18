const cheerio = require('cheerio')
const axios = require('axios')
const { DateTime } = require('luxon')

const API_ENDPOINT = 'https://tv-programme.telecablesat.fr/chaine'

module.exports = {
  site: 'telecablesat.fr',
  days: 2,
  delay: 5000,
  url: function ({ channel, date }) {
    return `${API_ENDPOINT}/${channel.site_id}/index.html?date=${date.format('YYYY-MM-DD')}`
  },
  async parser({ content, date, channel }) {
    let programs = []
    let items = parseItems(content)
    if (!items.length) return programs
    const url = `${API_ENDPOINT}/${channel.site_id}/index.html`
    const promises = [
      axios.get(`${url}?date=${date.format('YYYY-MM-DD')}&period=noon`),
      axios.get(`${url}?date=${date.format('YYYY-MM-DD')}&period=afternoon`)
    ]
    await Promise.allSettled(promises).then(results => {
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          items = items.concat(parseItems(r.value.data))
        }
      })
    })
    for (let item of items) {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (prev) {
        if (start < prev.start) {
          start = start.plus({ days: 1 })
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.plus({ hours: 1 })
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        icon: parseIcon($item),
        start,
        stop
      })
    }

    return programs
  },
  async channels() {
    const data = await axios
      .get(`https://tv-programme.telecablesat.fr/`)
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(data)
    const items = $(
      '#ptgv_left > section.main > div > div > div:nth-child(1) > div > div > div.linker.with_search > div.inside > div.scroller > a'
    ).toArray()

    return items.map(item => {
      const $item = cheerio.load(item)
      const link = $item('*').attr('href')
      const [_, site_id] = link.match(/\/chaine\/(\d+)\//) || [null, null]
      const name = $item('*').text().trim()
      return {
        lang: 'fr',
        site_id,
        name
      }
    })
  }
}

function parseStart($item, date) {
  const timeString = $item('.schedule-hour').text()
  if (!timeString) return null

  return DateTime.fromFormat(`${date.format('YYYY-MM-DD')} ${timeString}`, 'yyyy-MM-dd HH:mm', {
    zone: 'Europe/Paris'
  }).toUTC()
}

function parseIcon($item) {
  const imgSrc = $item('img').attr('src')

  return imgSrc ? `https:${imgSrc}` : null
}

function parseTitle($item) {
  return $item('div.item-content > div.title-left').text().trim()
}

function parseDescription($item) {
  return $item('div.item-content > p').text()
}

async function loadProgramDetails(item) {
  if (!item.onClick || !item.onClick.URLPage) return {}

  return await axios
    .get(item.onClick.URLPage)
    .then(r => r.data)
    .catch(console.error)
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $(
    '#ptgv_left > div.container > div.row.no-gutter > div.col-md-8 > div > div > div > div > div > div > div.news'
  ).toArray()
}
