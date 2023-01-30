const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
require('dayjs/locale/ar')

dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(utc)

module.exports = {
  site: 'elcinema.com',
  skip: true, // NOTE: the guide shows the wrong time (https://github.com/iptv-org/epg/issues/994)
  days: 2,
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
        icon: parseIcon(item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseIcon(item) {
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
