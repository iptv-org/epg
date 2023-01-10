const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'clickthecity.com',
  days: 2,
  url({ channel }) {
    return `https://www.clickthecity.com/tv/network/${channel.site_id}`
  },
  request: {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    data({ date }) {
      const params = new URLSearchParams()
      params.append('optDate', dayjs(date).tz('Asia/Manila').format('YYYY-MM-DD'))
      params.append('optTime', '00:00:00')

      return params
    }
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      const start = parseStart($item, date)
      const stop = parseStop($item, date)
      if (stop && prev && stop.isBefore(prev.start)) return
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
      .get(`https://www.clickthecity.com/tv-networks/`)
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(html)
    const items = $(
      '#main > div > div > div > section.elementor-section.elementor-top-section.elementor-element.elementor-element-a3c51b3.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div > div.elementor-column.elementor-col-50.elementor-top-column.elementor-element.elementor-element-b23e0a8 > div > div > div.elementor-element.elementor-element-b46952e.elementor-posts--align-center.elementor-grid-tablet-3.elementor-grid-mobile-3.elementor-grid-4.elementor-posts--thumbnail-top.elementor-widget.elementor-widget-posts > div > div > article'
    ).toArray()

    return items.map(item => {
      const name = $(item).find('div > h3').text().trim()
      const url = $(item).find('a').attr('href')
      const [_, site_id] = url.match(/network\/(.*)\//) || [null, null]

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
  const url = $item('td > a').attr('href') || ''
  const [_, time] = url.match(/starttime=(\d{1,2}%3A\d{2}\+(AM|PM))/) || [null, null]
  if (!time) return null

  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${time.replace('%3A', ':')}`,
    'YYYY-MM-DD h:mm A',
    'Asia/Manila'
  )
}

function parseStop($item, date) {
  const url = $item('td > a').attr('href') || ''
  const [_, time] = url.match(/endtime=(\d{1,2}%3A\d{2}\+(AM|PM))/) || [null, null]
  if (!time) return null

  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${time.replace('%3A', ':')}`,
    'YYYY-MM-DD h:mm A',
    'Asia/Manila'
  )
}

function parseItems(content, date) {
  const $ = cheerio.load(content)
  const stringDate = date.format('MMMM DD')

  return $(`#tvlistings > tbody > tr:not(.bg-dark)`).toArray()
}
