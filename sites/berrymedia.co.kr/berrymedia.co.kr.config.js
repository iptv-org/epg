const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

dayjs.Ls.en.weekStart = 1

module.exports = {
  site: 'berrymedia.co.kr',
  days: 2,
  url({ channel }) {
    return `http://www.berrymedia.co.kr/schedule_proc${channel.site_id}.php`
  },
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest'
    },
    data({ date }) {
      let params = new URLSearchParams()
      let startOfWeek = date.startOf('week').format('YYYY-MM-DD')
      let endOfWeek = date.endOf('week').format('YYYY-MM-DD')

      params.append('week', `${startOfWeek}~${endOfWeek}`)
      params.append('day', date.format('YYYY-MM-DD'))

      return params
    }
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(30, 'm')
      programs.push({
        title: parseTitle($item),
        category: parseCategory($item),
        rating: parseRating($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart($item, date) {
  const time = $item('span:nth-child(1)').text().trim()

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Asia/Seoul')
}

function parseTitle($item) {
  return $item('span.sdfsdf').clone().children().remove().end().text().trim()
}

function parseCategory($item) {
  return $item('span:nth-child(2) > p').text().trim()
}

function parseRating($item) {
  const rating = $item('span:nth-child(5) > p:nth-child(1)').text().trim()

  return rating
    ? {
        system: 'KMRB',
        value: rating
      }
    : null
}

function parseItems(content, channel, date) {
  const $ = cheerio.load(content)

  return $('.sc_time dd').toArray()
}
