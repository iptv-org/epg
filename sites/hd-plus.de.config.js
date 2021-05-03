const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

module.exports = {
  lang: 'de',
  site: 'hd-plus.de',
  channels: 'hd-plus.de.channels.xml',
  output: '.gh-pages/guides/hd-plus.de.guide.xml',
  url({ date, channel }) {
    const now = dayjs()
    const day = now.diff(date, 'd')

    return `https://www.hd-plus.de/epg/channel/${channel.site_id}?d=${day}`
  },
  logo({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('header > img')

    return img ? img.src : null
  },
  parser({ content }) {
    const dom = new JSDOM(content)
    const items = dom.window.document.querySelectorAll('table > tbody > tr')
    let programs = []
    items.forEach(item => {
      const title = (item.querySelector('td:nth-child(1) > a') || { textContent: '' }).textContent
      const fullDate = (item.querySelector('td:nth-child(2)') || { textContent: '' }).textContent
      if (title && fullDate) {
        const time = fullDate.split(' ').pop()
        const local = dayjs.utc(time, 'HH:mm').toString()
        const start = dayjs.tz(local.toString(), 'Europe/Berlin').toString()

        if (programs.length && !programs[programs.length - 1].stop) {
          programs[programs.length - 1].stop = start
        }

        programs.push({
          title,
          start
        })
      }
    })

    return programs
  }
}
