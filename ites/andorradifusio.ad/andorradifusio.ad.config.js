const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

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
        if (start < prev.start) {
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

  return dayjs.tz(dateString, 'MM/DD/YYYY HH:mm', 'Europe/Madrid').utc()
}

function parseItems(content, date) {
  const $ = cheerio.load(content)
  const day = dayjs(date.valueOf()).locale('ca').format('DD MMMM').toLowerCase()
  const column = $('.programacio-dia > h3 > .dia')
    .filter((i, el) => $(el).text() === day.slice(0, 6) + '.')
    .first()
    .parent()
    .parent()
  const items = []
  const titles = column.find('p').toArray()
  column.find('h4').each((i, time) => {
    items.push({
      time: $(time).text(),
      title: $(titles[i]).text()
    })
  })

  return items
}
