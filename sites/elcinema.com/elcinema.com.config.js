const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
require('dayjs/locale/ar')

dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(utc)

const headers = {
  'User-Agent':
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0' }

module.exports = {
  site: 'elcinema.com',
  days: 2,
  request: { headers },
  url({ channel }) {
    const lang = channel.lang === 'en' ? 'en/' : '/'

    return `https://elcinema.com/${lang}tvguide/${channel.site_id}/`
  },
  parser({ content, channel, date }) {
    const programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      const start = parseStart(item, date)
      const duration = parseDuration(item)
      const stop = start.add(duration, 'm')
      programs.push({
        title: parseTitle(item),
        description: parseDescription(item),
        category: parseCategory(item),
        image: parseImage(item),
        start,
        stop
      })
    })

    return programs
  },
  async channels({ lang }) {
    const axios = require('axios')
    const data = await axios
      .get(`https://elcinema.com/${lang}/tvguide/`)
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(data)

    return $('.tv-line')
      .map((i, el) => {
        const link = $(el).find('.channel > div > div.hide-for-small-only > a')
        const name = $(link).text()
        const href = $(link).attr('href')
        const [, site_id] = href.match(/\/(\d+)\/$/)

        return {
          lang,
          site_id,
          name
        }
      })
      .get()
  }
}

function parseImage(item) {
  const $ = cheerio.load(item)
  const imgSrc =
    $('.row > div.columns.small-3.large-1 > a > img').data('src') ||
    $('.row > div.columns.small-5.large-1 > img').data('src')

  return imgSrc || null
}

function parseCategory(item) {
  const $ = cheerio.load(item)
  const category = $('.row > div.columns.small-6.large-3 > ul > li:nth-child(2)').text()

  return category.replace(/\(\d+\)/, '').trim() || null
}

function parseDuration(item) {
  const $ = cheerio.load(item)
  const duration =
    $('.row > div.columns.small-3.large-2 > ul > li:nth-child(2) > span').text() ||
    $('.row > div.columns.small-7.large-11 > ul > li:nth-child(2) > span').text()

  return duration.replace(/\D/g, '') || ''
}

function parseStart(item, initDate) {
  const $ = cheerio.load(item)
  let time =
    $('.row > div.columns.small-3.large-2 > ul > li:nth-child(1)').text() ||
    $('.row > div.columns.small-7.large-11 > ul > li:nth-child(2)').text() ||
    ''

  time = time
    .replace(/\[.*\]/, '')
    .replace('مساءً', 'PM')
    .replace('صباحًا', 'AM')
    .trim()

  time = `${initDate.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(time, 'YYYY-MM-DD hh:mm A', dayjs.tz.guess())
}

function parseTitle(item) {
  const $ = cheerio.load(item)

  return (
    $('.row > div.columns.small-6.large-3 > ul > li:nth-child(1) > a').text() ||
    $('.row > div.columns.small-7.large-11 > ul > li:nth-child(1)').text() ||
    null
  )
}

function parseDescription(item) {
  const $ = cheerio.load(item)
  const excerpt = $('.row > div.columns.small-12.large-6 > ul > li:nth-child(3)').text() || ''

  return excerpt.replace('...اقرأ المزيد', '').replace('...Read more', '')
}

function parseItems(content, channel, date) {
  const $ = cheerio.load(content)

  const dateString = date.locale(channel.lang).format('dddd D')

  const list = $('.dates')
    .filter((i, el) => {
      let parsedDateString = $(el).text().trim()
      parsedDateString = parsedDateString.replace(/\s\s+/g, ' ')

      return parsedDateString.includes(dateString)
    })
    .first()
    .parent()
    .next()

  return $('.padded-half', list).toArray()
}
