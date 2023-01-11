const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'arianatelevision.com',
  days: 2,
  url: `https://www.arianatelevision.com/program-schedule/`,
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
      programs.push({
        title: item.title,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  const time = `${date.format('YYYY-MM-DD')} ${item.start}`

  return dayjs.tz(time, 'YYYY-MM-DD H:mm', 'Asia/Kabul')
}

function parseItems(content, date) {
  const items = []
  const col = date.day()
  const $ = cheerio.load(content)
  const settings = $('#jtrt_table_settings_508').text()
  if (!settings) return []
  const data = JSON.parse(settings)
  if (!data || !Array.isArray(data)) return []

  let rows = data[0]
  rows.shift()
  const output = []
  rows.forEach(row => {
    let day = date.day() + 2
    if (day > 7) day = 1
    if (!row[0] || !row[day]) return
    output.push({
      start: row[0].trim(),
      title: row[day].trim()
    })
  })

  return output
}
