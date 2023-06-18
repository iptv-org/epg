const cheerio = require('cheerio')
const axios = require('axios')
const { DateTime } = require('luxon')

module.exports = {
  site: 'tvgids.nl',
  days: 2,
  url: function ({ date, channel }) {
    const path =
      DateTime.now().day === DateTime.fromMillis(date.valueOf()).day
        ? ''
        : `${date.format('DD-MM-YYYY')}/`

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
        if (start < prev.start) {
          start = start.plus({ days: 1 })
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.plus({ minutes: 30 })
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
  const time = $item('.program__starttime').clone().children().remove().end().text().trim()

  return DateTime.fromFormat(`${date.format('YYYY-MM-DD')} ${time}`, 'yyyy-MM-dd HH:mm', {
    zone: 'Europe/Amsterdam'
  }).toUTC()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('.guide__guide .program').toArray()
}
