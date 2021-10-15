const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

module.exports = {
  site: 'vidio.com',
  url({ channel }) {
    return `https://www.vidio.com/live/${channel.site_id}/schedules`
  },
  parser({ content, date }) {
    let PM = false
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const title = parseTitle(item)
      const start = parseStart(item, date)
      let stop = parseStop(item, date)
      if (!stop) return
      if (stop.hour() > 11) PM = true
      if (stop.hour() < 12 && PM) stop = stop.add(1, 'd')

      programs.push({
        title,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStop(item, date) {
  const time = (
    item.querySelector('div.b-livestreaming-daily-schedule__item-content-caption') || {
      textContent: ''
    }
  ).textContent

  return dayjs.tz(
    date.format('YYYY-MM-DD ').concat(time.substring(8, 13)),
    'YYYY-MM-DD HH:mm',
    'Asia/Jakarta'
  )
}

function parseStart(item, date) {
  const time = (
    item.querySelector('div.b-livestreaming-daily-schedule__item-content-caption') || {
      textContent: ''
    }
  ).textContent

  return dayjs.tz(
    date.format('YYYY-MM-DD ').concat(time.substring(0, 5)),
    'YYYY-MM-DD HH:mm',
    'Asia/Jakarta'
  )
}

function parseTitle(item) {
  return (
    item.querySelector('div.b-livestreaming-daily-schedule__item-content-title') || {
      textContent: ''
    }
  ).textContent
}

function parseItems(content, date) {
  const dom = new JSDOM(content)
  const list = dom.window.document.querySelector(
    `#schedule-content-${date.format(
      'YYYYMMDD'
    )} > .b-livestreaming-daily-schedule__scroll-container`
  )

  if (!list) return []

  return list.querySelectorAll('div.b-livestreaming-daily-schedule__item')
}
