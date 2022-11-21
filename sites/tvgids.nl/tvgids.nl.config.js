const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'tvgids.nl',
  url: function ({ date, channel }) {
    const path = dayjs.utc().isSame(date, 'd') ? '' : `${date.format('DD-MM-YYYY')}/`

    return `https://www.tvgids.nl/gids/${path}${channel.site_id}`
  },
  parser: function ({ content, date }) {
    date = date.subtract(1, 'd')
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
        icon: parseIcon($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(`https://www.tvgids.nl/gids/`)
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(data)

    const channels = []
    $('#channel-container > div').each((i, el) => {
      channels.push({
        site_id: $(el).find('a').attr('id'),
        name: $(el).find('img').attr('title'),
        lang: 'nl'
      })
    })

    return channels
  }
}

function parseTitle($item) {
  return $item('.program__title').text().trim()
}

function parseDescription($item) {
  return $item('.program__text').text().trim()
}

function parseIcon($item) {
  return $item('.program__thumbnail').data('src')
}

function parseStart($item, date) {
  const time = $item('.program__starttime').text().trim()

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Europe/Amsterdam')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('.guide__guide .program').toArray()
}
