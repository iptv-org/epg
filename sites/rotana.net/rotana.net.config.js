const cheerio = require('cheerio')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(customParseFormat)

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 OPR/104.0.0.0'
}

module.exports = {
  site: 'rotana.net',
  days: 2,
  url({ channel }) {
    return `https://rotana.net/${channel.lang}/streams?channel=${channel.site_id}`
  },
  request: {
    headers,
    timeout: 15000
  },
  parser({ content, date }) {
    const programs = []

    const items = parseItems(content, date)
    items.forEach(item => {
      const info = item.find('.iq-accordion-block > .iq-accordion-title .big-title span')
      if (info.length) {
        const details = item.find('.trending-info div > span')
        const [ time, title ] = info.text().split('\n')
        const [ _, duration, description ] = details.text().split('\n')
        if (duration) {
          const start = dayjs.tz(`${date.format('YYYY-MM-DD')} ${time.trim()}`, 'YYYY-MM-DD HH:mm', 'Asia/Riyadh')
          const stop = addDuration(start, duration.trim())

          programs.push({
            title: title.trim(),
            description: description.trim(),
            start: start.toISOString(),
            stop: stop.toISOString()
          })
        }
      }
    })

    return programs
  },
  async channels({ lang = 'en'}) {
    const axios = require('axios')
    const options = {headers}
    const result = await axios
      .get(`https://rotana.net/${lang}/streams`, options)
      .then(response => response.data)
      .catch(console.error)

      const $ = cheerio.load(result)
      const items = $('#channels-list a').toArray()
      const channels = items.map(item => {
        const $item = $(item)
        const data = $item.attr('href').match(/channel=([A-Za-z0-9]+)/)
  
        return {
          lang,
          site_id: data[1],
          name: $item.text().trim()
        }
      })
  
      return channels
    }
}

function addDuration(date, duration) {
  const matches = duration.matchAll(/(\d+)(h|m|s|ms)/g)
  while (true) {
    const m = matches.next()
    if (!m.value) {
      break
    }
    if (m.value[1] && m.value[2]) {
      date = date.add(parseInt(m.value[1]), m.value[2])
    }
  }
  return date
}

function parseItems(content, date) {
  const result = []
  const $ = cheerio.load(content)

  const expectedId = `item-${date.format('DD-MM-YYYY')}`
  let lastId
  $('.hour > div').toArray().forEach(item => {
    const $item = $(item)
    if ($item.hasClass('bg')) {
      lastId = $item.attr('id')
    } else if ($item.hasClass('iq-accordion') && lastId === expectedId) {
      result.push($item)
    }
  })

  return result
}
