const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'beinsports.com',
  ignore: true, // NOTE: there is no program for the current date on the site
  url: function ({ date }) {
    return `https://epg.beinsports.com/utctime.php?mins=00&serviceidentity=beinsports.com&cdate=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  parser: function ({ content, channel, date }) {
    let offset = -1
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const title = parseTitle(item)
      const category = parseCategory(item)
      let start = parseStart(item, date)
      if (!start) return
      if (start.hour() > 18 && offset === -1) {
        start = start.subtract(1, 'd')
      } else if (start.hour() < 12 && offset === -1) {
        offset++
      }
      let stop = parseStop(item, date)
      if (!stop) return
      if (stop.hour() > 18 && offset === -1) {
        stop = stop.subtract(1, 'd')
      } else if (stop.hour() < 12 && offset === -1) {
        offset++
      }

      programs.push({
        title,
        category,
        start: start.toString(),
        stop: stop.toString()
      })
    })

    return programs
  }
}

function parseTitle(item) {
  const $ = cheerio.load(item)

  return $('.title').text()
}

function parseCategory(item) {
  const $ = cheerio.load(item)

  return $('.format').text()
}

function parseStart(item, date) {
  const $ = cheerio.load(item)
  let [_, time] = $('.time')
    .text()
    .match(/^(\d{2}:\d{2})/) || [null, null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.utc(time, 'YYYY-MM-DD HH:mm')
}

function parseStop(item, date) {
  const $ = cheerio.load(item)
  let [_, time] = $('.time')
    .text()
    .match(/(\d{2}:\d{2})$/) || [null, null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.utc(time, 'YYYY-MM-DD HH:mm')
}

function parseItems(content, channel) {
  const $ = cheerio.load(content)

  return $(`#channels_${channel.site_id} .slider > ul:first-child > li`).toArray()
}
