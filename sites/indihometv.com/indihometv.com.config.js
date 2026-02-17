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
  site: 'indihometv.com',
  days: 2,
  url({ channel }) {
    return `https://www.indihometv.com/livetv/${channel.site_id}`
  },
  parser({ content, date }) {
    const programs = []
    const [$, items] = parseItems(content, date)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = $(item)
      let start = parseStart($item, date)
      if (prev && start.isBefore(prev.start)) {
        start = start.add(1, 'd')
        date = date.add(1, 'd')
      }
      let stop = parseStop($item, date)
      if (stop.isBefore(start)) {
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
    const data = await axios
      .get('https://www.indihometv.com/tv/live')
      .then(response => response.data)
      .catch(console.error)

    const $ = cheerio.load(data)
    const items = $('#channelContainer a.channel-item').toArray()
    const channels = items.map(item => {
      const $item = $(item)

      return {
        lang: 'id',
        site_id: $item.data('url').substr($item.data('url').lastIndexOf('/') + 1),
        name: $item.data('name')
      }
    })

    return channels
  }
}

function parseStart($item, date) {
  const timeString = $item.find('p').text()
  const [, start] = timeString.match(/(\d{2}:\d{2}) -/) || [null, null]
  const dateString = `${date.format('YYYY-MM-DD')} ${start}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', tz)
}

function parseStop($item, date) {
  const timeString = $item.find('p').text()
  const [, stop] = timeString.match(/- (\d{2}:\d{2})/) || [null, null]
  const dateString = `${date.format('YYYY-MM-DD')} ${stop}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', tz)
}

function parseTitle($item) {
  return $item.find('b').text()
}

function parseItems(content, date) {
  const $ = cheerio.load(content)

  return [$, $(`#pills-${date.format('YYYY-MM-DD')} .schedule-item`).toArray()]
}
