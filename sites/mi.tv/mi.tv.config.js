const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'mi.tv',
  url({ date, channel }) {
    const [country, id] = channel.site_id.split('#')

    return `https://mi.tv/${country}/async/channel/${id}/${date.format('YYYY-MM-DD')}/0`
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
      const stop = start.add(1, 'h')
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
  let time = (item.querySelector('a > div.content > span.time') || { textContent: '' }).textContent
  if (!time) return null
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.utc(time, 'MM/DD/YYYY HH:mm')
}

function parseTitle(item) {
  return (item.querySelector('a > div.content > h2') || { textContent: '' }).textContent
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll('#listings > ul > li')
}
