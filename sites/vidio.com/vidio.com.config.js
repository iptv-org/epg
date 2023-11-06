const cheerio = require('cheerio')
const { DateTime } = require('luxon')

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
        start = start.plus({ days: 1 })
        date = date.add(1, 'd')
      }
      let stop = parseStop($item, date)
      if (stop < start) {
        stop = stop.plus({ days: 1 })
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
      .get('https://www.vidio.com/categories/276-daftar-channel-tv-radio-live-sports')
      .then(response => response.data)
      .catch(console.error)

    const $ = cheerio.load(result)
    const items = $('.home-content a').toArray()
    const channels = []
    items.forEach(item => {
      const $item = $(item)

      const name = $item.find('p').text()
      if (name.toUpperCase().indexOf('FM') < 0 && name.toUpperCase().indexOf('RADIO') < 0) {
        channels.push({
          lang: 'id',
          site_id: $item.attr('href').substr($item.attr('href').lastIndexOf('/') + 1).split('-')[0],
          name
        })
      }
    })

    return channels
  }  
}

function parseStart($item, date) {
  const timeString = $item('div.b-livestreaming-daily-schedule__item-content-caption').text()
  const [, start] = timeString.match(/(\d{2}:\d{2}) -/) || [null, null]
  const dateString = `${date.format('YYYY-MM-DD')} ${start}`

  return DateTime.fromFormat(dateString, 'yyyy-MM-dd HH:mm', { zone: 'Asia/Jakarta' }).toUTC()
}

function parseStop($item, date) {
  const timeString = $item('div.b-livestreaming-daily-schedule__item-content-caption').text()
  const [, stop] = timeString.match(/- (\d{2}:\d{2}) WIB/) || [null, null]
  const dateString = `${date.format('YYYY-MM-DD')} ${stop}`

  return DateTime.fromFormat(dateString, 'yyyy-MM-dd HH:mm', { zone: 'Asia/Jakarta' }).toUTC()
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
