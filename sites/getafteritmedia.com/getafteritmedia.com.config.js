const table2array = require('table2array')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const isoWeek = require('dayjs/plugin/isoWeek')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.extend(isoWeek)

module.exports = {
  site: 'getafteritmedia.com',
  days: 2,
  url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQcDmb9OnO0HpbjINfGaepqgGTp3VSmPs7hs654n3sRKrq4Q9y6uPSEvVvq9MwTLYG_n_V7vh0rFYP9/pubhtml',
  parser({ content, channel, date }) {
    const programs = []
    const items = parseItems(content, channel, date)
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
  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${item.time}`,
    'YYYY-MM-DD HH:mm A',
    'America/New_York'
  )
}

function parseItems(content, channel, date) {
  const day = date.isoWeekday()
  const $ = cheerio.load(content)
  const table = $.html($(`#${channel.site_id} table`))
  let data = table2array(table)
  data.splice(0, 5)

  return data.map(row => {
    return {
      time: row[1],
      title: row[day + 1]
    }
  })
}
