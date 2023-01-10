const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'vivacom.bg',
  days: 2,
  skip: true, // INFO: no longer available
  url({ date, channel }) {
    const [page] = channel.site_id.split('#')

    return `https://www.vivacom.bg/bg/tv/programa/?date=${date.format('YYYY-MM-DD')}&page=${page}`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: parseTitle(item),
        description: parseDescription(item),
        start: parseStart(item, date),
        stop: parseStop(item, date)
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  const $ = cheerio.load(item)
  let [_, time] = $('span')
    .text()
    .match(/^(\d{2}:\d{2}:\d{2})/) || [null, null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm:ss', 'Europe/Sofia').toJSON()
}

function parseStop(item, date, pm) {
  const $ = cheerio.load(item)
  let [_, time] = $('span')
    .text()
    .match(/(\d{2}:\d{2}:\d{2})$/) || [null, null]
  if (!time) return null
  if (time === '00:00:00') date = date.add(1, 'd')
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm:ss', 'Europe/Sofia').toJSON()
}

function parseTitle(item) {
  const $ = cheerio.load(item)

  return $('h3').text()
}

function parseDescription(item) {
  const $ = cheerio.load(item)

  return $('p').text()
}

function parseItems(content, channel) {
  const [_, channelId] = channel.site_id.split('#')
  const $ = cheerio.load(content)
  const listItem = $(`#scroll-vertical > li[title="${channelId}"]`)
  const i = $(`#scroll-vertical > li`).index(listItem)

  return $(`#scroll-horizontal > ul:nth-child(${i + 1}) li`).toArray()
}
