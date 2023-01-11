const dayjs = require('dayjs')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'programme.tvb.com',
  days: 2,
  url: function ({ channel, date }) {
    return `https://programme.tvb.com/ajax.php?action=channellist&code=${
      channel.site_id
    }&date=${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(30, 'm')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseTitle($item) {
  return $item('.ftit').text().trim()
}

function parseDescription($item) {
  return $item('.full').text().trim()
}

function parseStart($item, date) {
  const time = $item('.time').text()

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD hh:mmA', 'Asia/Hong_Kong')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('ul > li.item').toArray()
}
