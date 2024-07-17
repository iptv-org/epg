const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const debug = require('debug')('site:rotana.net')

dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(customParseFormat)

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 OPR/104.0.0.0'
}
const cookies = {}

module.exports = {
  site: 'rotana.net',
  days: 2,
  url({ channel }) {
    return `https://rotana.net/${channel.lang}/streams?channel=${channel.site_id}&tz=`
  },
  request: {
    headers,
    timeout: 15000
  },
  async parser({ content, headers, channel, date }) {
    const programs = []
    if (!cookies[channel.lang]) {
      cookies[channel.lang] = parseCookies(headers)
    }

    const items = parseItems(content, date)
    for (const item of items) {
      const program = await parseProgram(item, channel)
      if (program) {
        programs.push(program)
      }
    }

    return programs
  },
  async channels({ lang = 'en' }) {
    const result = await axios
      .get(`https://rotana.net/api/channels`)
      .then(response => response.data)
      .catch(console.error)

    return result.data.map(item => {
      return {
        lang,
        site_id: item.id,
        name: item.name[lang]
      }
    })
  }
}

async function parseProgram(item, channel, options = {}) {
  options = options || {}
  const deep = options.deep !== undefined ? options.deep : true
  const raw = options.raw !== undefined ? options.raw : false
  const top = item.find('.iq-accordion-block')
  const info = top.find('.iq-accordion-title .big-title span')
  if (info.length) {
    const [time, title] = info.text().split('\n')
    const [d, m, y] = item._date.split('-')
    const start = dayjs.tz(`${y}-${m}-${d} ${time.trim()}`, 'YYYY-MM-DD HH:mm', 'Asia/Riyadh')
    let description, image, stop
    if (deep) {
      const pid = top.attr('id').split('-')[1]
      if (pid) {
        const url = `https://rotana.net/${channel.lang}/streams?channel=${channel.site_id}&itemId=${pid}`
        const params = {
          headers: Object.assign({}, headers, { 'X-Requested-With': 'XMLHttpRequest' }),
          Cookie: cookies[channel.lang]
        }
        debug(`fetching description ${url}`)
        const result = await axios
          .get(url, params)
          .then(response => response.data)
          .catch(console.error)

        const $ = cheerio.load(result)
        const details = $('.trending-info div > span')
        if (details.length) {
          description = details.text().split('\n')[3].trim()
        }
        const img = $('.row > div > img')
        if (img.length) {
          image = img.attr('src')
        }
      }
      if (item._next) {
        const next = await parseProgram(item._next, channel, { deep: false, raw: true })
        if (next.start) {
          stop = next.start
        }
      }
    }
    return {
      title: title?.trim(),
      description: description?.trim(),
      image,
      start: raw ? start : start?.toISOString(),
      stop: raw ? stop : stop?.toISOString()
    }
  }
}

function parseItems(content, date) {
  const result = []
  const $ = cheerio.load(content)

  const expectedId = `item-${date.format('DD-MM-YYYY')}`
  let lastId
  $('.hour > div').each((_, item) => {
    const $item = $(item)
    if ($item.hasClass('bg')) {
      lastId = $item.attr('id')
    } else if ($item.hasClass('iq-accordion')) {
      $item._date = lastId.substr(lastId.indexOf('-') + 1)
      // is date match?
      if (lastId === expectedId) {
        // set next item
        if (result.length) {
          result[result.length - 1]._next = $item
        }
        result.push($item)
      } else if (result.length && !result[result.length - 1]._next) {
        // set next item
        result[result.length - 1]._next = $item
      }
    }
  })

  return result
}

function parseCookies(headers) {
  const cookies = []
  if (headers && Array.isArray(headers['set-cookie'])) {
    headers['set-cookie'].forEach(cookie => {
      cookies.push(cookie.split('; ')[0])
    })
  }
  return cookies.length ? cookies.join('; ') : null
}
