const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'clickthecity.com',
  days: 2,
  url({ channel }) {
    return `https://www.clickthecity.com/tv/channels/?netid=${channel.site_id}`
  },
  request: {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    data({ date }) {
      const params = new URLSearchParams()
      params.append('optDate', dayjs(date.valueOf()).tz('Asia/Manila').format('YYYY-MM-DD'))
      params.append('optTime', '00:00:00')

      return params
    }
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      let stop = parseStop($item, date)
      if (!start || !stop) return
      if (start > stop) {
        stop = stop.add(1, 'day')
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
    const html = await axios
      .get('https://www.clickthecity.com/tv/channels/')
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(html)
    const items = $('#channels .col').toArray()

    return items.map(item => {
      const name = $(item).find('.card-body').text().trim()
      const url = $(item).find('a').attr('href')
      const [, site_id] = url.match(/netid=(\d+)/) || [null, null]

      return {
        lang: 'en',
        site_id,
        name
      }
    })
  }
}

function parseTitle($item) {
  return $item('td > a').text().trim()
}

function parseStart($item, date) {
  const url = $item('td.cPrg > a').attr('href') || ''
  let [, time] = url.match(/starttime=(\d{1,2}%3A\d{2}\+(AM|PM))/) || [null, null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${decodeURIComponent(time).replace(/\+/g, ' ')}`

  return dayjs.tz(time, 'YYYY-MM-DD h:mm A', 'Asia/Manila').utc()
}

function parseStop($item, date) {
  const url = $item('td.cPrg > a').attr('href') || ''
  let [, time] = url.match(/endtime=(\d{1,2}%3A\d{2}\+(AM|PM))/) || [null, null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${decodeURIComponent(time).replace(/\+/g, ' ')}`

  return dayjs.tz(time, 'YYYY-MM-DD h:mm A', 'Asia/Manila').utc()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#tvlistings > tbody > tr')
    .filter(function () {
      return $(this).find('td.cPrg').length
    })
    .toArray()
}
