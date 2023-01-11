const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'bein.com',
  days: 2,
  url: function ({ date, channel }) {
    const [index] = channel.site_id.split('#')

    return `https://www.bein.com/en/epg-ajax-template/?action=epg_fetch&category=sports&cdate=${date.format(
      'YYYY-MM-DD'
    )}&language=EN&loadindex=${index}&mins=00&offset=0&postid=25356&serviceidentity=bein.net`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel)
    date = date.subtract(1, 'd')
    items.forEach(item => {
      const $item = cheerio.load(item)
      const title = parseTitle($item)
      if (!title) return
      const category = parseCategory($item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      let stop = parseStop($item, start)
      if (stop.isBefore(start)) {
        stop = stop.add(1, 'd')
      }
      programs.push({
        title,
        category,
        start,
        stop
      })
    })

    return programs
  }
}

function parseTitle($item) {
  return $item('.title').text()
}

function parseCategory($item) {
  return $item('.format').text()
}

function parseStart($item, date) {
  let [_, time] = $item('.time')
    .text()
    .match(/^(\d{2}:\d{2})/) || [null, null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Asia/Qatar')
}

function parseStop($item, date) {
  let [_, time] = $item('.time')
    .text()
    .match(/(\d{2}:\d{2})$/) || [null, null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Asia/Qatar')
}

function parseItems(content, channel) {
  const [_, channelId] = channel.site_id.split('#')
  const $ = cheerio.load(content)

  return $(`#channels_${channelId} .slider > ul:first-child > li`).toArray()
}
