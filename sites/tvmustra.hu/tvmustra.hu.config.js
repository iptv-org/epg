const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

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
          start = start.add(1, 'day')
          date = date.add(1, 'day')
        }
        prev.stop = start
      }
      const stop = start.add(30, 'minute')
      const title = parseTitle($item)

      programs.push({
        title,
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
  return $item('div[class^="musor_lista_cim"]').first().text().trim()
}

function parseStart($item, date) {
  const time = $item('div[class^="musor_lista_idopont"]').first().text().trim()

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Europe/Budapest').utc()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('div[data-page="channel"][data-show]').toArray()
}
