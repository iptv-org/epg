const jsdom = require('jsdom')
const iconv = require('iconv-lite')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  days: 3,
  site: 'tvgid.ua',
  url: function ({ date, channel }) {
    return `https://tvgid.ua/channels/${channel.site_id}/${date.format('DDMMYYYY')}/tmall/`
  },
  parser: function ({ buffer, date }) {
    let PM = false
    const programs = []
    const items = parseItems(buffer)
    items.forEach(item => {
      const title = parseTitle(item)
      let start = parseStart(item, date)
      if (!start) return
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = start.add(1, 'h')
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({ title, start, stop })
    })

    return programs
  }
}

function parseStart(item, date) {
  let time = (item.querySelector('td > table > tbody > tr > td.time') || { textContent: '' })
    .textContent
  if (!time) return null
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Kiev')
}

function parseTitle(item) {
  return (
    item.querySelector('td > table > tbody > tr > td.item > a') ||
    item.querySelector('td > table > tbody > tr > td.item') || { textContent: '' }
  ).textContent
}

function parseItems(buffer) {
  const string = iconv.decode(buffer, 'win1251')
  const dom = new JSDOM(string)

  return dom.window.document.querySelectorAll(
    '#container > tbody > tr:nth-child(2) > td > table > tbody > tr > td > table:nth-child(2) > tbody > tr:not(:first-child)'
  )
}
