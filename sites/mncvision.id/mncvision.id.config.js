const FormData = require('form-data')
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
  site: 'mncvision.id',
  url: `https://mncvision.id/schedule/table`,
  request: {
    timeout: 10000,
    method: 'POST',
    data: function ({ channel, date }) {
      const formData = new FormData()
      formData.setBoundary('X-EPG-BOUNDARY')
      formData.append('search_model', 'channel')
      formData.append('af0rmelement', 'aformelement')
      formData.append('fdate', date.format('YYYY-MM-DD'))
      formData.append('fchannel', channel.site_id)
      formData.append('submit', 'Search')

      return formData
    },
    headers: {
      'Content-Type': 'multipart/form-data; boundary=X-EPG-BOUNDARY'
    }
  },
  logo({ channel }) {
    return `https://www.mncvision.id/userfiles/image/channel/channel_${channel.site_id}.png`
  },
  async parser({ content, date }) {
    const programs = []
    const items = parseItems(content)
    for (const item of items) {
      const title = parseTitle(item)
      const start = parseStart(item, date)
      const duration = parseDuration(item)
      const stop = start.add(duration, 'm')
      const description = await loadDescription(item)

      programs.push({
        title,
        description,
        start: start.toJSON(),
        stop: stop.toJSON()
      })
    }

    return programs
  },
  async channels() {
    const data = await axios
      .get('https://www.mncvision.id/schedule')
      .then(response => response.data)
      .catch(console.log)

    const $ = cheerio.load(data)
    const items = $('select[name="fchannel"] option').toArray()
    const channels = items.map(item => {
      const $item = cheerio.load(item)

      return {
        lang: 'id',
        site_id: $item('*').attr('value'),
        name: $item('*').text()
      }
    })

    return channels
  }
}

async function loadDescription(item) {
  const $item = cheerio.load(item)
  const progUrl = $item('a').attr('href')
  if (!progUrl) return null
  const data = await axios
    .get(progUrl)
    .then(r => r.data)
    .catch(console.log)
  if (!data) return null
  const $page = cheerio.load(data)
  const description = $page('.synopsis').text().trim()
  if (description === '-') return null

  return description
}

function parseDuration(item) {
  const $ = cheerio.load(item)
  let duration = $('td:nth-child(3)').text()
  const match = duration.match(/(\d{2}):(\d{2})/)
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])

  return hours * 60 + minutes
}

function parseStart(item, date) {
  const $ = cheerio.load(item)
  let time = $('td:nth-child(1)').text()
  time = `${date.format('DD/MM/YYYY')} ${time}`

  return dayjs.tz(time, 'DD/MM/YYYY HH:mm', 'Asia/Jakarta')
}

function parseTitle(item) {
  const $ = cheerio.load(item)

  return $('td:nth-child(2) > a').text()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('tr[valign="top"]').toArray()
}
