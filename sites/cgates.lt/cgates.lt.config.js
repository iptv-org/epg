const dayjs = require('dayjs')
const axios = require('axios')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'cgates.lt',
  days: 2,
  url: function ({ channel }) {
    return `https://www.cgates.lt/tv-kanalai/${channel.site_id}/`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
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
        description: parseDescription($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    let html = await axios
      .get(`https://www.cgates.lt/televizija/tv-programa-savaitei/`)
      .then(r => r.data)
      .catch(console.log)
    let $ = cheerio.load(html)
    const items = $('.kanalas_wrap').toArray()

    return items.map(item => {
      const name = $(item).find('h6').text().trim()
      const link = $(item).find('a').attr('href')
      const [_, site_id] = link.match(/\/tv-kanalai\/(.*)\//) || [null, null]

      return {
        lang: 'lt',
        site_id,
        name
      }
    })
  }
}

function parseTitle($item) {
  const title = $item('td:nth-child(2) > .vc_toggle > .vc_toggle_title').text().trim()

  return title || $item('td:nth-child(2)').text().trim()
}

function parseDescription($item) {
  return $item('.vc_toggle_content > p').text().trim()
}

function parseStart($item, date) {
  const time = $item('.laikas')

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Europe/Vilnius')
}

function parseItems(content, date) {
  const $ = cheerio.load(content)
  const section = $(
    'article > div:nth-child(2) > div.vc_row.wpb_row.vc_row-fluid > div > div > div > div > div'
  )
    .filter(function () {
      return $(`.dt-fancy-title:contains("${date.format('YYYY-MM-DD')}")`, this).length === 1
    })
    .first()

  return $('.tv_programa tr', section).toArray()
}
