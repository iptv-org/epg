const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'mon-programme-tv.be',
  days: 2,
  url({ date, channel }) {
    return `https://www.mon-programme-tv.be/chaine/${date.format('DDMMYYYY')}/${
      channel.site_id
    }.html`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
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
        description: parseDescription($item),
        category: parseCategory($item),
        icon: parseIcon($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(`https://www.mon-programme-tv.be/chaine/toutes-les-chaines-television.html`)
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(data)

    const channels = []
    $('.list-chaines > ul > li').each((i, el) => {
      const [, site_id] = $(el)
        .find('a')
        .attr('href')
        .match(/\/chaine\/(.*).html/) || [null, null]
      const [, name] = $(el)
        .find('a')
        .attr('title')
        .match(/Programme TV ce soir (.*)/) || [null, null]

      channels.push({
        site_id,
        name,
        lang: 'fr'
      })
    })

    return channels
  }
}

function parseTitle($item) {
  return $item('.title').text().trim()
}

function parseDescription($item) {
  return $item('.episode').text().trim()
}

function parseCategory($item) {
  return $item('.type').text().trim()
}

function parseIcon($item) {
  return $item('.image img').data('src')
}

function parseStart($item, date) {
  const time = $item('.hour').text().trim()

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Europe/Brussels')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('.box').toArray()
}
