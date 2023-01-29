const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'virginmediatelevision.ie',
  days: 2,
  url({ date }) {
    return `https://www.virginmediatelevision.ie/includes/ajax/tv_guide.php?date=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1h
    }
  },
  parser({ content, channel, date }) {
    const programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      let duration = parseDuration($item)
      let stop = start.add(duration, 'm')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        sub_title: parseSubTitle($item),
        icon: parseIcon($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseTitle($item) {
  return $item('.info > h2').text().trim()
}

function parseDescription($item) {
  return $item('.info').data('description')
}

function parseSubTitle($item) {
  return $item('.info').data('subtitle')
}

function parseIcon($item) {
  return $item('.info').data('image')
}

function parseStart($item, date) {
  const [time] = $item('.info')
    .data('time')
    .match(/^\d{1,2}\.\d{2}(am|pm)/) || [null]

  if (!time) return null

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD h.mma', 'Europe/London')
}

function parseDuration($item) {
  const duration = $item('.info > .time').data('minutes')

  return duration ? parseInt(duration) : 30
}

function parseItems(content, channel) {
  const $ = cheerio.load(content)

  return $(`.programs_parent > .programs[data-channel='${channel.site_id}'] > .program`).toArray()
}
