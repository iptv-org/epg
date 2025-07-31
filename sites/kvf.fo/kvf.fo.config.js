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
  days: 2,
  url({ date }) {
    return `https://kvf.fo/nskra/sv?date=${date.format('YYYY-MM-DD')}`
  },
  parser({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (!start) return
      if (prev && start.isBefore(prev.stop)) {
        start = start.add(1, 'd')
        date = date.add(1, 'd')
      }
      let stop = parseStop($item, date)
      if (stop.isBefore(start)) {
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

  return $('.view > .view-content > div.views-row').toArray()
}
