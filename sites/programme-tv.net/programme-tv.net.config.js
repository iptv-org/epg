const durationParser = require('parse-duration')
const cheerio = require('cheerio')
const srcset = require('srcset')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'programme-tv.net',
  days: 2,
  url: function ({ date, channel }) {
    return `https://www.programme-tv.net/programme/chaine/${date.format('YYYY-MM-DD')}/programme-${
      channel.site_id
    }.html`
  },
  parser: function ({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const title = parseTitle($item)
      const icon = parseIcon($item)
      const category = parseCategory($item)
      const start = parseStart($item, date)
      const duration = parseDuration($item)
      const stop = start.add(duration, 'ms')

      programs.push({ title, icon, category, start, stop })
    })

    return programs
  }
}

function parseStart($item, date) {
  let time = $item('.mainBroadcastCard-startingHour').first().text().trim()
  time = `${date.format('MM/DD/YYYY')} ${time.replace('h', ':')}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Paris')
}

function parseDuration($item) {
  const duration = $item('.mainBroadcastCard-durationContent').first().text().trim()

  return durationParser(duration)
}

function parseIcon($item) {
  const img = $item('.mainBroadcastCard-imageContent').first().find('img')
  const value = img.attr('srcset') || img.data('srcset')
  const obj = value ? srcset.parse(value).find(i => i.width === 128) : {}

  return obj.url
}

function parseCategory($item) {
  return $item('.mainBroadcastCard-genre').first().text().trim()
}

function parseTitle($item) {
  return $item('.mainBroadcastCard-title').first().text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('.mainBroadcastCard').toArray()
}
