const dayjs = require('dayjs')
const cheerio = require('cheerio')
const table2array = require('table2array')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

require('dayjs/locale/es')

module.exports = {
  site: 'telebilbao.es',
  days: 1,
  url: 'https://www.telebilbao.es/programacion-2/',
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  parser({ content, date }) {
    let programs = []
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
  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${item.time}`, 'YYYY-MM-DD HH:mm', 'Europe/Madrid')
}

function parseItems(content, date) {
  const $ = cheerio.load(content)
  const tableHtml = $('table.programacion').html()
  let tableArray = table2array(`<table>${tableHtml}</table>`)
  const day = date.locale('es').format('dddd\nD MMMM').toUpperCase()
  if (!tableArray[0]) return []
  const indexOfColumn = tableArray[0].indexOf(day)
  tableArray.pop()
  const items = []
  tableArray.forEach(row => {
    items.push({
      time: row[0],
      title: row[indexOfColumn]
    })
  })

  return items.filter(i => Boolean(i.time))
}
