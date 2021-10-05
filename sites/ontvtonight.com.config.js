const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const tz = {
  au: 'Australia/Sydney',
  ie: 'Europe/Dublin',
  uk: 'Europe/London'
}

module.exports = {
  days: 3,
  site: 'ontvtonight.com',
  url: function ({ date, channel }) {
    const [region, id] = channel.site_id.split('#')
    let url = `https://www.ontvtonight.com`
    if (region) url += `/${region}`
    url += `/guide/listings/channel/${id}.html?dt=${date.format('YYYY-MM-DD')}`

    return url
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img =
      dom.window.document.querySelector('#content > div > div > div.span6 > img') ||
      dom.window.document.querySelector('#inner-headline > div > div > div > img')

    return img ? img.src : null
  },
  parser: function ({ content, date, channel }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      const start = parseStart(item, date, channel)
      const stop = start.add(1, 'h')

      if (title && start) {
        if (programs.length) {
          programs[programs.length - 1].stop = start
        }

        programs.push({
          title,
          start,
          stop
        })
      }
    })

    return programs
  }
}

function parseStart(item, date, channel) {
  const [region, id] = channel.site_id.split('#')
  const timezone = region ? tz[region] : tz['uk']

  let time = (item.querySelector('td:nth-child(1) > h5') || { textContent: '' }).textContent.trim()
  time = `${date.format('DD/MM/YYYY')} ${time.toUpperCase()}`

  return dayjs.tz(time, 'DD/MM/YYYY H:mm A', timezone)
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
