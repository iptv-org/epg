const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'walesi.com.fj',
  days: 2,
  skip: true, // the program is no longer available on the website
  url: 'https://www.walesi.com.fj/wp-admin/admin-ajax.php',
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    data({ channel, date }) {
      const params = new URLSearchParams()
      params.append('chanel', channel.site_id)
      params.append('date', date.unix())
      params.append('action', 'extvs_get_schedule_simple')

      return params
    }
  },
  parser({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      const start = parseStart($item, date)
      const stop = start.add(30, 'm')
      if (prev) prev.stop = start
      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(`https://www.walesi.com.fj/channel-guide/`)
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(data)
    const channels = $(
      'div.ex-chanel-list > div.extvs-inline-chanel > ul > li.extvs-inline-select'
    ).toArray()
    return channels.map(item => {
      const $item = cheerio.load(item)
      const [_, name] = $item('span')
        .text()
        .trim()
        .match(/\d+\. (.*)/) || [null, null]
      return {
        lang: 'fj',
        site_id: $item('*').data('value'),
        name
      }
    })
  }
}

function parseTitle($item) {
  return $item('td.extvs-table1-programme > div > div > figure > h3').text()
}

function parseStart($item, date) {
  let time = $item('td.extvs-table1-time > span').text().trim()
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(time, 'YYYY-MM-DD H:mm a', 'Pacific/Fiji')
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data.html) return []
  const $ = cheerio.load(data.html)

  return $('table > tbody > tr').toArray()
}
