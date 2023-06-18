const cheerio = require('cheerio')
const axios = require('axios')
const { DateTime } = require('luxon')

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
      params.append(
        'optDate',
        DateTime.fromMillis(date.valueOf()).setZone('Asia/Manila').toFormat('yyyy-MM-dd')
      )
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
        stop = stop.plus({ days: 1 })
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
      .get(`https://www.clickthecity.com/tv/channels/`)
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(html)
    const items = $('#channels .col').toArray()

    return items.map(item => {
      const name = $(item).find('.card-body').text().trim()
      const url = $(item).find('a').attr('href')
      const [_, site_id] = url.match(/netid=(\d+)/) || [null, null]

      return {
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
  let [_, time] = url.match(/starttime=(\d{1,2}%3A\d{2}\+(AM|PM))/) || [null, null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${time.replace('%3A', ':').replace('+', ' ')}`

  return DateTime.fromFormat(time, 'yyyy-MM-dd h:mm a', { zone: 'Asia/Manila' }).toUTC()
}

function parseStop($item, date) {
  const url = $item('td.cPrg > a').attr('href') || ''
  let [_, time] = url.match(/endtime=(\d{1,2}%3A\d{2}\+(AM|PM))/) || [null, null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${time.replace('%3A', ':').replace('+', ' ')}`

  return DateTime.fromFormat(time, 'yyyy-MM-dd h:mm a', { zone: 'Asia/Manila' }).toUTC()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $(`#tvlistings > tbody > tr`)
    .filter(function () {
      return $(this).find('td.cPrg').length
    })
    .toArray()
}
