const FormData = require('form-data')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'en',
  site: 'mncvision.id',
  channels: 'mncvision.id.channels.xml',
  output: '.gh-pages/guides/mncvision.id.guide.xml',
  request: {
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
  url({ channel }) {
    return `https://www.mncvision.id/schedule/table`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      const start = parseStart(item, date)
      const duration = parseDuration(item)
      const stop = start.add(duration, 'm')

      programs.push({ title, start, stop })
    })

    return programs
  }
}

function parseDuration(item) {
  let duration = (item.querySelector('td:nth-child(3)') || { textContent: '' }).textContent
  const match = duration.match(/(\d{2}):(\d{2})/)
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])

  return hours * 60 + minutes
}

function parseStart(item, date) {
  let time = (item.querySelector('td:nth-child(1)') || { textContent: '' }).textContent
  time = `${date.format('DD/MM/YYYY')} ${time}`

  return dayjs.tz(time, 'DD/MM/YYYY HH:mm', 'Asia/Jakarta')
}

function parseTitle(item) {
  return (item.querySelector('td:nth-child(2) > a') || { textContent: '' }).textContent
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll('tr[valign="top"]')
}
