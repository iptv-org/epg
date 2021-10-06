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
  days: 3,
  site: 'znbc.co.zm',
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
      const title = item.title
      const start = parseStart(item, date)
      const stop = start.add(30, 'm')
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({ title, start, stop })
    })

    return programs
  }
}

function parseStart(item, date) {
  const time = `${date.format('MM/DD/YYYY')} ${item.time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Africa/Lusaka')
}

function parseItems(content, date) {
  const items = []
  const day = date.day() // 0 => Sunday
  const dom = new JSDOM(content)
  const tabs = dom.window.document.querySelectorAll(
    `.elementor-tabs-content-wrapper > div[id*='elementor-tab-content']`
  )
  const table = tabs[day].querySelector(`table`)
  const data = tabletojson.convert(table.outerHTML)
  if (!data) return items
  const rows = data[0]

  return rows
    .map(row => {
      const time = row['0'].slice(0, 5).trim()
      const title = row['0'].replace(time, '').replace(/\s\s+/g, ' ').trim()

      return { time, title }
    })
    .filter(i => dayjs(i.time, 'HH:mm').isValid())
}
