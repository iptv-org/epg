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
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const title = parseTitle(item)
      const start = parseStart(item, date)
      const stop = parseStop(item, start)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({ title, start, stop })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.endOf('d')
}

function parseStart(item, date) {
  const row = (item.querySelector('td > p') || { textContent: '' }).textContent
  let time = row.split(' ').shift()
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Africa/Lusaka')
}

function parseTitle(item) {
  const row = (item.querySelector('td > p') || { textContent: '' }).textContent
  const title = row.split(' ')
  title.shift()

  return title
    .map(i => i.trim())
    .filter(s => s)
    .join(' ')
}

function parseItems(content, date) {
  const day = date.day() // 0 => Sunday
  const dom = new JSDOM(content)
  const tabs = dom.window.document.querySelectorAll(
    `.elementor-tabs-content-wrapper > div[id*='elementor-tab-content']`
  )

  return tabs[day].querySelectorAll(`table > tbody > tr:not(:first-child)`)
}
