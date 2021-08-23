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
  site: 'ontvtonight.com',
  channels: 'ontvtonight.com.channels.xml',
  output: '.gh-pages/guides/ontvtonight.com.guide.xml',
  url: function ({ date, channel }) {
    const [region, id] = channel.site_id.split('#')
    return region
      ? `https://www.ontvtonight.com/${region}/guide/listings/channel/${id}.html?dt=${date.format(
          'YYYY-MM-DD'
        )}`
      : `https://www.ontvtonight.com/guide/listings/channel/${id}.html?dt=${date.format(
          'YYYY-MM-DD'
        )}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img =
      dom.window.document.querySelector('#content > div > div > div.span6 > img') ||
      dom.window.document.querySelector('#inner-headline > div > div > div > img')

    return img ? img.src : null
  },
  parser: function ({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      const start = parseStart(item, date)

      if (title && start) {
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

function parseStart(item, date) {
  let time = (item.querySelector('td:nth-child(1) > h5') || { textContent: '' }).textContent.trim()
  time = `${date.format('DD/MM/YYYY')} ${time.toUpperCase()}`

  return dayjs.tz(time, 'DD/MM/YYYY H:mm A', 'Europe/London')
}

function parseTitle(item) {
  return (item.querySelector('td:nth-child(2) > h5 > a') || { textContent: '' }).textContent
    .toString()
    .trim()
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll(
    '#content > div > div > div.span6 > table > tbody > tr'
  )
}
