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
  site: 'transvision.co.id',
  url: `https://www.transvision.co.id/jadwalacara/epg`,
  request: {
    method: 'POST',
    data: function ({ channel, date }) {
      const formData = new URLSearchParams()
      formData.append('ValidateEPG[channel_name]', channel.site_id)
      formData.append('ValidateEPG[tanggal]', date.format('YYYY-MM-DD'))
      formData.append('ValidateEPG[sinopsis]', '')
      formData.append('yt0', 'PROSES')

      return formData
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
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
      .get('https://www.transvision.co.id/jadwalacara/epg')
      .then(response => response.data)
      .catch(console.log)

    const $ = cheerio.load(data)
    const items = $('#ValidateEPG_channel_name option').toArray()
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
  return cheerio.load(item)('td:last-child').text()
}

function parseDuration(item) {
  const $ = cheerio.load(item)
  let duration = $('th').text()
  const match = duration.match(/(\d{2}):(\d{2}):\d{2}/)
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])

  return hours * 60 + minutes
}

function parseStart(item, date) {
  const $ = cheerio.load(item)
  let time = $('th').text()
  time = `${date.format('DD/MM/YYYY')} ${time}`

  return dayjs.tz(time, 'DD/MM/YYYY HH:mm', 'Asia/Jakarta')
}

function parseTitle(item) {
  const $ = cheerio.load(item)

  return $('td:first-of-type').text()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('table tbody tr').toArray()
}
