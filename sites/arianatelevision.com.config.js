const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const tabletojson = require('tabletojson').Tabletojson

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'en',
  days: 7,
  site: 'arianatelevision.com',
  channels: 'arianatelevision.com.channels.xml',
  output: '.gh-pages/guides/arianatelevision.com.guide.xml',
  url() {
    return `https://www.arianatelevision.com/program-schedule/`
  },
  parser({ content, date }) {
    let PM = false
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const title = item.title
      let start = parseStart(item, date)
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = start.add(30, 'm')
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

function parseStart(item, date) {
  const time = `${date.format('MM/DD/YYYY')} ${item.start}`

  return dayjs.tz(time, 'MM/DD/YYYY h:mmA', 'Asia/Kabul')
}

function parseItems(content, date) {
  const items = []
  const dom = new JSDOM(content)
  const dayOfWeek = date.format('dddd')
  const el = dom.window.document.getElementById('jtrt_table_508')
  const data = tabletojson.convert(el.outerHTML)
  if (!data) return items
  const rows = data[0]

  return rows.map(r => ({ start: r.Start, title: r[dayOfWeek] })).filter(i => i.start)
}
