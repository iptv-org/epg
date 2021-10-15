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
  lang: 'de',
  site: 'hd-plus.de',
  url({ date, channel }) {
    const today = dayjs().utc().startOf('d')
    const day = date.diff(today, 'd')

    return `https://www.hd-plus.de/epg/channel/${channel.site_id}?d=${day}`
  },
  logo({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('header > img')

    return img ? img.src : null
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      let start = parseStart(item, date)
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
  let time = (item.querySelector('td:nth-child(2)') || { textContent: '' }).textContent
  time = time.split(' ').pop()
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Berlin')
}

function parseTitle(item) {
  return (item.querySelector('td:nth-child(1) > a') || { textContent: '' }).textContent
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll('table > tbody > tr')
}
