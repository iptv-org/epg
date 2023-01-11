const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const tabletojson = require('tabletojson').Tabletojson

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'znbc.co.zm',
  days: 2,
  url({ channel }) {
    return `https://www.znbc.co.zm/${channel.site_id}/`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      let start = parseStart(item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(30, 'm')
      programs.push({ title: item.title, start, stop })
    })

    return programs
  }
}

function parseStart(item, date) {
  const dateString = `${date.format('YYYY-MM-DD')} ${item.time}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', 'Africa/Lusaka')
}

function parseItems(content, date) {
  const dayOfWeek = date.format('dddd').toUpperCase()
  const $ = cheerio.load(content)
  const table = $(`.elementor-tab-mobile-title:contains("${dayOfWeek}")`).next().html()
  if (!table) return []
  const data = tabletojson.convert(table)
  if (!Array.isArray(data) || !Array.isArray(data[0])) return []

  return data[0]
    .map(row => {
      const [_, time, title] = row['0'].replace(/\s\s/g, ' ').match(/^(\d{2}:\d{2}) (.*)/) || [
        null,
        null,
        null
      ]
      if (!time || !title.trim()) return null

      return { time, title: title.trim() }
    })
    .filter(i => i)
}
