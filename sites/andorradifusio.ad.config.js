const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

let PM = false
module.exports = {
  lang: 'ca',
  site: 'andorradifusio.ad',
  channels: 'andorradifusio.ad.channels.xml',
  output: '.gh-pages/guides/andorradifusio.ad.guide.xml',
  url({ channel }) {
    return `https://www.andorradifusio.ad/programacio/${channel.site_id}`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const title = parseTitle(item)
      let start = parseStart(item, date)
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = parseStop(item, date)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({
        title,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.tz('Europe/Madrid').endOf('d').add(6, 'h')
}

function parseStart(item, date) {
  let time = (item.time || { textContent: '' }).textContent
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Madrid')
}

function parseTitle(item) {
  return (item.title || { textContent: '' }).textContent
}

function parseItems(content, date) {
  const items = []
  const dom = new JSDOM(content)
  const day = date.day() - 1
  const colNum = day < 0 ? 6 : day
  const cols = dom.window.document.querySelectorAll('.programacio-dia')
  const col = cols[colNum]
  const timeRows = col.querySelectorAll(`h4`)
  const titleRows = col.querySelectorAll(`p`)
  timeRows.forEach((time, i) => {
    items.push({
      time,
      title: titleRows[i]
    })
  })

  return items
}
