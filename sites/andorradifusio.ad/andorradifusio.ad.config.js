const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
require('dayjs/locale/ca')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'andorradifusio.ad',
  days: 2,
  url({ channel }) {
    return `https://www.andorradifusio.ad/programacio/${channel.site_id}`
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
      const stop = start.add(1, 'h')
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
  const dateString = `${date.format('MM/DD/YYYY')} ${item.time}`

  return dayjs.tz(dateString, 'MM/DD/YYYY HH:mm', 'Europe/Madrid')
}

function parseItems(content, date) {
  const $ = cheerio.load(content)
  const dayOfWeek = dayjs(date).locale('ca').format('dddd').toLowerCase()
  const column = $('.programacio-dia > h3')
    .filter((i, el) => $(el).text().startsWith(dayOfWeek))
    .first()
    .parent()
  const items = []
  const titles = column.find(`p`).toArray()
  column.find(`h4`).each((i, time) => {
    items.push({
      time: $(time).text(),
      title: $(titles[i]).text()
    })
  })

  return items
}
