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

let PM = false
module.exports = {
  lang: 'cs',
  site: 'm.tv.sms.cz',
  channels: 'm.tv.sms.cz.channels.xml',
  output: '.gh-pages/guides/m.tv.sms.cz.guide.xml',
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
    const programs = []
    const items = parseItems(buffer)
    items.forEach((item, i) => {
      const title = parseTitle(item)
      const description = parseDescription(item)
      const start = parseStart(item, date)
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = parseStop(item, date)
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

function parseStop(item, date) {
  return date.tz('Europe/Prague').endOf('d').add(6, 'h')
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
