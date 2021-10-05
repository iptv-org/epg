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
  site: 'm.tv.sms.cz',
  url: function ({ date, channel }) {
    return `https://m.tv.sms.cz/index.php?stanice=${channel.site_id}&cas=0&den=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('.logo_out > img')

    return img ? img.src : null
  },
  parser: function ({ buffer, date }) {
    let PM = false
    const programs = []
    const items = parseItems(buffer)
    items.forEach((item, i) => {
      const title = parseTitle(item)
      const description = parseDescription(item)
      let start = parseStart(item, date)
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = start.add(1, 'h')
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({
        title,
        description,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  let time = (item.querySelector('div > span') || { textContent: '' }).textContent.trim()

  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH.mm', 'Europe/Prague')
}

function parseDescription(item) {
  return (item.querySelector('a > div.detail') || { textContent: '' }).textContent.trim()
}

function parseTitle(item) {
  return (item.querySelector('a > div') || { textContent: '' }).textContent.trim()
}

function parseItems(buffer) {
  const string = iconv.decode(buffer, 'win1250')
  const dom = new JSDOM(string)

  return dom.window.document.querySelectorAll('#obsah > div > div.porady > div.porad')
}
