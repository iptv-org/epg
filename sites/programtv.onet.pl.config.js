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
  lang: 'pl',
  site: 'programtv.onet.pl',
  channels: 'programtv.onet.pl.channels.xml',
  output: '.gh-pages/guides/programtv.onet.pl.guide.xml',
  url: function ({ date, channel }) {
    const day = dayjs().diff(date, 'd')
    return `https://programtv.onet.pl/program-tv/${channel.site_id}?dzien=${day}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('#channelTV > section > header > span > img')

    return img ? 'https:' + img.src : null
  },
  parser: function ({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      const description = parseDescription(item)
      const category = parseCategory(item)
      let start = parseStart(item, date)
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = parseStop(item, date)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({
        title,
        description,
        category,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.tz('Europe/Warsaw').endOf('d').add(6, 'h')
}

function parseStart(item, date) {
  let time = (item.querySelector('.hours > .hour') || { textContent: '' }).textContent
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Warsaw')
}

function parseCategory(item) {
  return (item.querySelector('.titles > .type') || { textContent: '' }).textContent
}

function parseDescription(item) {
  return (item.querySelector('.titles > p') || { textContent: '' }).textContent
}

function parseTitle(item) {
  return (item.querySelector('.titles > a') || { textContent: '' }).textContent
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll('#channelTV > section > div.emissions > ul > li')
}
