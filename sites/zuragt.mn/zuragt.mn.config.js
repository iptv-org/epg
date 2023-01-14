const dayjs = require('dayjs')
const axios = require('axios')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'zuragt.mn',
  days: 2,
  url: function ({ channel, date }) {
    return `https://m.zuragt.mn/channel/${channel.site_id}/?date=${date.format('YYYY-MM-DD')}`
  },
  request: {
    maxRedirects: 0,
    validateStatus: function (status) {
      return status >= 200 && status < 303
    }
  },
  parser: async function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    for (let item of items) {
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
        start,
        stop
      })
    }

    return programs
  },
  async channels() {
    let html = await axios
      .get(`https://www.zuragt.mn/`)
      .then(r => r.data)
      .catch(console.log)
    let $ = cheerio.load(html)

    const items = $('.tv-box > ul > li').toArray()
    return items
      .map(item => {
        const name = $(item).text().trim()
        const link = $(item).find('a').attr('href')

        if (!link) return null

        const [_, site_id] = link.match(/\/channel\/(.*)\//) || [null, null]

        return {
          lang: 'mn',
          site_id,
          name
        }
      })
      .filter(Boolean)
  }
}

function parseTitle($item) {
  return $item('.program').text().trim()
}

function parseStart($item, date) {
  const time = $item('.time')

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Asia/Ulaanbaatar')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('body > div > div > div > ul > li').toArray()
}
