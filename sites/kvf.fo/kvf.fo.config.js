const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'kvf.fo',
  url({ date }) {
    return `https://kvf.fo/nskra/uv?date=${date.format('YYYY-MM-DD')}`
  },
  logo({ channel }) {
    return channel.logo
  },
  parser({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      let stop = parseStop($item, date)
      if (start.isAfter(stop)) {
        stop = stop.add(1, 'd')
        date = date.add(1, 'd')
      }
      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart($item, date) {
  const string = $item('.s-normal > .s-time1').text().trim()
  let [time] = string.match(/^(\d{2}:\d{2})/g) || [null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Atlantic/Faroe')
}

function parseStop($item, date) {
  const string = $item('.s-normal > .s-time1').text().trim()
  let [time] = string.match(/(\d{2}:\d{2})$/g) || [null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Atlantic/Faroe')
}

function parseTitle($item) {
  return $item('.s-normal > .s-heiti').text()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $(
    '#block-system-main > div > div > div.panels-flexible-row.panels-flexible-row-339-main-row.panels-flexible-row-last.clearfix > div > div.panels-flexible-region.panels-flexible-region-339-center.panels-flexible-region-first > div > div > div > div > div.view-content > div.views-row'
  ).toArray()
}
