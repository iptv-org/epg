const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'arianaafgtv.com',
  days: 2,
  url() {
    return `https://www.arianaafgtv.com/index.html`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const title = item.title
      const start = parseStart(item, date)
      const stop = parseStop(item, date)
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
  const time = `${date.format('MM/DD/YYYY')} ${item.end.toUpperCase()}`

  return dayjs.tz(time, 'MM/DD/YYYY hh:mm A', 'Asia/Kabul')
}

function parseStart(item, date) {
  const time = `${date.format('MM/DD/YYYY')} ${item.start.toUpperCase()}`

  return dayjs.tz(time, 'MM/DD/YYYY hh:mm A', 'Asia/Kabul')
}

function parseItems(content, date) {
  const $ = cheerio.load(content)
  const dayOfWeek = date.format('dddd')
  const column = $('.H4')
    .filter((i, el) => {
      return $(el).text() === dayOfWeek
    })
    .first()
    .parent()

  const rows = column
    .find('.Paragraph')
    .map((i, el) => {
      return $(el).html()
    })
    .toArray()
    .map(r => (r === '&nbsp;' ? '|' : r))
    .join(' ')
    .split('|')

  const items = []
  rows.forEach(row => {
    row = row.trim()
    if (row) {
      const found = row.match(/(\d+(|:\d+)(a|p)m-\d+(|:\d+)(a|p)m)/gi)
      if (!found) return
      const time = found[0]
      let start = time.match(/(\d+(|:\d+)(a|p)m)-/i)[1]
      start = dayjs(start.toUpperCase(), ['hh:mmA', 'h:mmA', 'hA']).format('hh:mm A')
      let end = time.match(/-(\d+(|:\d+)(a|p)m)/i)[1]
      end = dayjs(end.toUpperCase(), ['hh:mmA', 'h:mmA', 'hA']).format('hh:mm A')
      const title = row.replace(time, '').replace('&nbsp;', '').trim()
      items.push({ start, end, title })
    }
  })

  return items
}
