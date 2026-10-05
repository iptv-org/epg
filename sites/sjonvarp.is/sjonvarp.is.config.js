const dayjs = require('dayjs')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'sjonvarp.is',
  days: 2,
  url: function ({ channel, date }) {
    return `http://www.sjonvarp.is/index.php?Tm=%3F&p=idag&c=${channel.site_id}&y=${date.format(
      'YYYY'
    )}&m=${date.format('MM')}&d=${date.format('DD')}`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
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
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const cheerio = require('cheerio')

    const data = await axios
      .get('https://sjonvarp.is/')
      .then(r => r.data)
      .catch(console.log)

    let channels = []

    const $ = cheerio.load(data)
    $('.listing-row').each((i, el) => {
      const site_id = $(el).attr('id')
      const title = $(el).find('a.channel').first().attr('title')
      const [, name] = title.match(/^Skoða dagskránna á (.*) í dag$/)

      channels.push({
        lang: 'is',
        site_id,
        name
      })
    })

    return channels
  }
}

function parseTitle($item) {
  return $item('.day-listing-title').text()
}

function parseDescription($item) {
  return $item('.day-listing-description').text()
}

function parseStart($item, date) {
  const time = $item('.day-listing-time')

  return dayjs.utc(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $(
    'body > div.container.nano-container > div > ul > div.day-listing > div:not(.day-listing-channel)'
  ).toArray()
}
