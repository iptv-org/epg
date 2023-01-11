const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
var url = require('url')
var path = require('path')

dayjs.extend(timezone)

module.exports = {
  site: 'gatotv.com',
  days: 2,
  url: function ({ channel, date }) {
    return `https://www.gatotv.com/canal/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach((item, index) => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (prev && start.isBefore(prev.stop)) {
        start = start.add(1, 'd')
        date = date.add(1, 'd')
      } else if (!prev && start.hour() > 12) {
        start = start.subtract(1, 'd')
        date = date.subtract(1, 'd')
      }
      let stop = parseStop($item, date)
      if (stop.isBefore(start)) {
        stop = stop.add(1, 'd')
        date = date.add(1, 'd')
      }
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        icon: parseIcon($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels({ country }) {
    const data = await axios
      .get(`https://www.gatotv.com/guia_tv/${country}`)
      .then(response => response.data)
      .catch(console.log)

    const $ = cheerio.load(data)
    const items = $('.tbl_EPG_row,.tbl_EPG_rowAlternate').toArray()
    const channels = items.map(item => {
      const $item = cheerio.load(item)
      const link = $item('td:nth-child(1) > div:nth-child(2) > a:nth-child(3)').attr('href')
      const parsed = url.parse(link)

      return {
        lang: 'es',
        site_id: path.basename(parsed.pathname),
        name: $item('td:nth-child(1) > div:nth-child(2) > a:nth-child(3)').text()
      }
    })

    return channels
  }
}

function parseTitle($item) {
  return $item('td:nth-child(4) > div > div > a > span,td:nth-child(3) > div > div > span').text()
}

function parseDescription($item) {
  return $item('td:nth-child(4) > div').clone().children().remove().end().text().trim()
}

function parseIcon($item) {
  return $item('td:nth-child(3) > a > img').attr('src')
}

function parseStart($item, date) {
  let time = $item('td:nth-child(1) > div > time').attr('datetime')
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'America/New_York')
}

function parseStop($item, date) {
  let time = $item('td:nth-child(2) > div > time').attr('datetime')
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'America/New_York')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $(
    'body > div.div_content > table:nth-child(8) > tbody > tr:nth-child(2) > td:nth-child(1) > table.tbl_EPG'
  )
    .find('.tbl_EPG_row,.tbl_EPG_rowAlternate,.tbl_EPG_row_selected')
    .toArray()
}
