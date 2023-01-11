const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'telsu.fi',
  days: 2,
  url: function ({ date, channel }) {
    return `https://www.telsu.fi/${date.format('YYYYMMDD')}/${channel.site_id}`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      let stop = parseStop($item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
        }
        prev.stop = start
        if (stop.isBefore(prev.stop)) {
          stop = stop.add(1, 'd')
        }
      }
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
    const html = await axios
      .get(`https://www.telsu.fi/`)
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(html)
    const items = $('.ch').toArray()
    return items.map(item => {
      const name = $(item).find('a').attr('title')
      const site_id = $(item).attr('rel')

      return {
        lang: 'fi',
        site_id,
        name
      }
    })
  }
}

function parseTitle($item) {
  return $item('h1 > b').text().trim()
}

function parseDescription($item) {
  return $item('.t > div').clone().children().remove().end().text().trim()
}

function parseIcon($item) {
  const imgSrc = $item('.t > div > div.ps > a > img').attr('src')

  return imgSrc ? `https://www.telsu.fi${imgSrc}` : null
}

function parseStart($item, date) {
  const subtitle = $item('.h > h2').clone().children().remove().end().text().trim()
  const [_, HH, mm] = subtitle.match(/(\d{2})\.(\d{2}) - (\d{2})\.(\d{2})$/) || [null, null, null]
  if (!HH || !mm) return null

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${HH}:${mm}`, 'YYYY-MM-DD HH:mm', 'Europe/Helsinki')
}

function parseStop($item, date) {
  const subtitle = $item('.h > h2').clone().children().remove().end().text().trim()
  const [_, HH, mm] = subtitle.match(/ - (\d{2})\.(\d{2})$/) || [null, null, null]
  if (!HH || !mm) return null

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${HH}:${mm}`, 'YYYY-MM-DD HH:mm', 'Europe/Helsinki')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#res > div.dets').toArray()
}
