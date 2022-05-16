const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'useetv.com',
  method: 'GET',
  delay: 100,
  url: function ({ channel }) {
    return `https://useetv.com/livetv/${channel.site_id}`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (prev && start.isBefore(prev.start)) {
        start = start.add(1, 'd')
        date = date.add(1, 'd')
      }
      let stop = parseStop($item, date)
      if (stop.isBefore(start)) {
        stop = stop.add(1, 'd')
        date = date.add(1, 'd')
      }
      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseTitle($item) {
  if ($item('a.schedule-item > b').text() != '') {
	  return $item('a.schedule-item > b').text()
  } else {
	  return $item('div.schedule-item > b').text()
  }
}


function parseStart($item, date) {
  if ($item('a.schedule-item > p').text() != '') {
	  timeString = $item('a.schedule-item > p').text()
  } else {
	  timeString = $item('div.schedule-item > p').text()
  }
  const [_, start] = timeString.match(/(\d{2}:\d{2}) -/) || [null, null]
  const dateString = `${date.format('YYYY-MM-DD')} ${start}`
  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', 'Africa/Juba')
}

function parseStop($item, date) {
  if ($item('a.schedule-item > p').text() != '') {
	  timeString = $item('a.schedule-item > p').text()
  } else {
	  timeString = $item('div.schedule-item > p').text()
  }
  const [_, stop] = timeString.match(/- (\d{2}:\d{2})/) || [null, null]
  const dateString = `${date.format('YYYY-MM-DD')} ${stop}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', 'Africa/Juba')
}

function parseItems(content, date) {
  const $ = cheerio.load(content)
  return $(`div.row > div.col-md-8 > div.left-content > div.schedule-list > div#pills-${date.format('YYYY-MM-DD')} > div.row > div.col-md-6.col-xs-12 >  div.col-xs-12`).toArray()
}
