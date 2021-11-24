const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'ruv.is',
  url({ channel, date }) {
    return `https://www.ruv.is/dagskra/${channel.site_id}/${date.format('YYYYMMDD')}`
  },
  parser({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      let stop = start.add(1, 'h')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        icon: parseIcon($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseTitle($item) {
  return $item('span.field-content.ruv-color').text()
}

function parseDescription($item) {
  return $item('div.views-field > span > div > span > p').text().trim()
}

function parseIcon($item) {
  return $item('div.views-field > span > div > div img').attr('src')
}

function parseStart($item, date) {
  const string = $item('strong').text()
  const time = `${date.format('YYYY-MM-DD')} ${string}`

  return dayjs.tz(time, 'YYYY-MM-DD HH : mm', 'Atlantic/Reykjavik')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#ruv_api_calendar > ul > li').toArray()
}
