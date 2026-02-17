const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const tz = 'Africa/Casablanca'

module.exports = {
  site: 'snrt.ma',
  days: 2,
  url({ channel }) {
    return `https://www.snrt.ma/ar/node/${channel.site_id}`
  },
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  parser({ content, date }) {
    const [$, items] = parseItems(content)
    const programs = items.map(item => {
      const $item = $(item)
      const start = parseStart($item)
      return {
        title: parseTitle($item),
        description: parseDescription($item),
        category: parseCategory($item),
        start
      }
    }).filter(item => item.start).sort((a, b) => a.start - b.start)
    // fill start-stop
    for (let i = 0; i < programs.length; i++) {
      if (i < programs.length - 1) {
        programs[i].stop = programs[i + 1].start
      } else {
        programs[i].stop = dayjs.tz(
          `${date.add(1, 'd').format('YYYY-MM-DD')} 00:00`,
          'YYYY-MM-DD HH:mm',
          tz
        )
      }
    }

    return programs.filter(p => p.start.isSame(date, 'd'))
  },
  async channels({ lang = 'ar' }) {
    const axios = require('axios')
    const result = await axios
      .get('https://www.snrt.ma/ar/node/1208')
      .then(response => response.data)
      .catch(console.error)

    const $ = cheerio.load(result)
    const items = $('.channels-row h4').toArray()
    const channels = items.map(item => {
      const $item = $(item)
      const url = $item.find('a').attr('href')
      return {
        lang,
        site_id: url.substr(url.lastIndexOf('/') + 1),
        name: $item.find('img').attr('alt')
      }
    })

    return channels
  }
}

function parseStart($item) {
  const date = $item.attr('class').match(/\d{8}/)[0]
  const time = $item.find('.grille-time').text().trim()
  if (time) {
    return dayjs.tz(`${date} ${time.replace('H', ':')}`, 'YYYYMMDD HH:mm', tz)
  }
}

function parseTitle($item) {
  return $item.find('.program-title-sm').text().trim()
}

function parseDescription($item) {
  return $item.find('.program-description-sm').text().trim()
}

function parseCategory($item) {
  return $item.find('.genre-first').text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return [$, $('.grille-line').toArray()]
}
