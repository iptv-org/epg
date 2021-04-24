const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'en',
  site: 'znbc.co.zm',
  channels: 'znbc.co.zm.channels.xml',
  output: '.gh-pages/guides/znbc.co.zm.guide.xml',
  url({ channel }) {
    return `https://www.znbc.co.zm/${channel.site_id}/`
  },
  logo({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector(
      '.elementor-tabs-content-wrapper > .elementor-tab-content > table > tbody > tr:nth-child(1) > td > span > img'
    )

    return img ? img.dataset.src : null
  },
  parser({ content, date }) {
    const day = date.day() // 0 => Sunday
    const programs = []
    const dom = new JSDOM(content)
    const tabs = dom.window.document.querySelectorAll(
      `.elementor-tabs-content-wrapper > div[id*='elementor-tab-content']`
    )
    const items = tabs[day].querySelectorAll(`table > tbody > tr`)

    items.forEach(item => {
      const row = (item.querySelector('td > p') || { textContent: '' }).textContent
      const parts = row.split(' ')
      const time = parts.shift()
      const title = parts.filter(str => str && /\S/.test(str)).join(' ')

      if (!time || !title) return false

      const start = dayjs
        .utc(time, 'HH:mm')
        .set('D', date.get('D'))
        .set('M', date.get('M'))
        .set('y', date.get('y'))

      if (!start.isValid()) return false

      if (programs.length && !programs[programs.length - 1].stop) {
        programs[programs.length - 1].stop = start
      }

      programs.push({
        title,
        start
      })
    })

    return programs
  }
}
