const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'pt',
  days: 3,
  site: 'mi.tv',
  channels: 'mi.tv.channels.xml',
  output: '.gh-pages/guides/mi.tv.guide.xml',
  url({ date, channel }) {
    const [country, id] = channel.site_id.split('#')

    return `https://mi.tv/${country}/async/channel/${id}/${date.format('YYYY-MM-DD')}/-180`
  },
  logo({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('#listings > div.channel-info > img')
    return img ? img.src : null
  },
  parser({ content, date }) {
    let PM = false
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      let start = parseStart(item, date)
      if (!start) return
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = parseStop(item, start)
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
  return date.tz('America/Sao_Paulo').add(1, 'h')
}

function parseStart(item, date) {
  let time = (item.querySelector('a > div.content > span.time') || { textContent: '' }).textContent
  if (!time) return null
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'America/Sao_Paulo')
}

function parseTitle(item) {
  return (item.querySelector('a > div.content > h2') || { textContent: '' }).textContent
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll('#listings > ul > li')
}
