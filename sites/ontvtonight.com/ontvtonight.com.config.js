const cheerio = require('cheerio')
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
  uk: 'Europe/London',
  us: 'America/New_York'
}

module.exports = {
  site: 'ontvtonight.com',
  days: 2,
  url: function ({ date, channel }) {
    const [region, id] = channel.site_id.split('#')
    let url = `https://www.ontvtonight.com`
    if (region) url += `/${region}`
    url += `/guide/listings/channel/${id}.html?dt=${date.format('YYYY-MM-DD')}`

    return url
  },
  parser: function ({ content, date, channel }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      const start = parseStart($item, date, channel)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(1, 'h')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart($item, date, channel) {
  const [region, id] = channel.site_id.split('#')
  const timezone = region ? tz[region] : tz['uk']
  const timeString = $item('td:nth-child(1) > h5').text().trim()
  const dateString = `${date.format('YYYY-MM-DD')} ${timeString}`

  return dayjs.tz(dateString, 'YYYY-MM-DD H:mm a', timezone)
}

function parseTitle($item) {
  return $item('td:nth-child(2) > h5').text().trim()
}

function parseDescription($item) {
  return $item('td:nth-child(2) > h6').text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#content > div > div > div.span6 > table > tbody > tr').toArray()
}
