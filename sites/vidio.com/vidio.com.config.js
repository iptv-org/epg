const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const tz = 'Asia/Jakarta'

module.exports = {
  site: 'vidio.com',
  days: 2,
  url({ channel }) {
    return `https://www.vidio.com/live/${channel.site_id}/schedules`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (prev && start < prev.start) {
        start = start.add(1, 'd')
        date = date.add(1, 'd')
      }
      let stop = parseStop($item, date)
      if (stop < start) {
        stop = stop.add(1, 'd')
        date = date.add(1, 'd')
      }
      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const cheerio = require('cheerio')
    const result = await axios
      .get('https://www.vidio.com/categories/daftar-channel-tv-radio-live-sports')
      .then(response => response.data)
      .catch(console.error)

    const $ = cheerio.load(result)
    const itemGroups = $('div[data-variation="circle_horizontal"] ul').toArray()
    const channels = []

    itemGroups.forEach(group => {
      const $group = $(group)
      let skip = false
      const sites = []
      const items = $group.find('a[data-testid="circle-card"]').toArray()
      items.forEach(item => {
        const name = $(item).find('span[data-testid="circle-title"]').text()
        // skip radio channels
        if (name.toLowerCase().indexOf('fm') >= 0 || name.toLowerCase().indexOf('radio') >= 0) {
          skip = true
          return true
        }
        let url = $(item).attr('href')
        url = url.substr(url.lastIndexOf('/') + 1)
        const matches = url.match(/(\d+)/)
        sites.push({
          lang: 'id',
          site_id: matches[0],
          name: name
        })
      })
      if (!skip && sites.length) {
        channels.push(...sites)
      }
    })

    return channels
  }
}

function parseStart($item, date) {
  const timeString = $item('div.b-livestreaming-daily-schedule__item-content-caption').text()
  const [, start] = timeString.match(/(\d{2}:\d{2}) -/) || [null, null]

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${start}`, 'YYYY-MM-DD HH:mm', tz)
}

function parseStop($item, date) {
  const timeString = $item('div.b-livestreaming-daily-schedule__item-content-caption').text()
  const [, stop] = timeString.match(/- (\d{2}:\d{2}) WIB/) || [null, null]

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${stop}`, 'YYYY-MM-DD HH:mm', tz)
}

function parseTitle($item) {
  return $item('div.b-livestreaming-daily-schedule__item-content-title').text()
}

function parseItems(content, date) {
  const $ = cheerio.load(content)

  return $(
    `#schedule-content-${date.format(
      'YYYYMMDD'
    )} > .b-livestreaming-daily-schedule__scroll-container .b-livestreaming-daily-schedule__item`
  ).toArray()
}
