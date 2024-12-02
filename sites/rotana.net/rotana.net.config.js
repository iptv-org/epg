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

const tz = 'Asia/Riyadh'
const nworker = 25

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
    if (items.length) {
      const workers = []
      const n = Math.min(nworker, items.length)
      while (workers.length < n) {
        const worker = () => {
          if (items.length) {
            const item = items.shift()
            parseProgram(item, channel)
              .then(() => {
                programs.push(item)
                worker()
              })
          } else {
            workers.splice(workers.indexOf(worker), 1)
          }
        }
        workers.push(worker)
        worker()
      }
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (workers.length === 0) {
            clearInterval(interval)
            resolve()
          }
        }, 500)
      })
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

async function parseProgram(item, channel) {
  if (item.program) {
    const url = `https://rotana.net/${channel.lang}/streams?channel=${channel.site_id}&itemId=${item.program}`
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
    const details = $('.trending-info .row div > span')
    if (details.length) {
      for (const el of details[0].children) {
        switch (el.constructor.name) {
          case 'Text':
            if (item.description === undefined) {
              const desc = $(el).text().trim()
              if (desc) {
                item.description = desc
              }
            }
            break;
          case 'Element':
            if (el.name === 'span') {
              const [k, v] = $(el).text().split(':').map(a => a.trim())
              switch (k) {
                case 'Category':
                case 'التصنيف':
                  item.category = v;
                  break;
                case 'Country':
                case 'البلد':
                  item.country = v;
                  break;
                case 'Director':
                case 'المخرج':
                  item.director = v;
                  break;
                case 'Language':
                case 'اللغة':
                  item.language = v;
                  break;
                case 'Release Year':
                case 'سنة الإصدار':
                  item.date = v;
                  break;
              }
            }
            break;
        }
      }
    }
    const img = $('.row > div > img')
    if (img.length) {
      item.image = img.attr('src')
    }
    delete item.program
  }
}

function parseItems(content, date) {
  const $ = cheerio.load(content)

  const items = []
  let curDate
  $('.hour > div').each((_, item) => {
    const $item = $(item)
    if ($item.hasClass('bg')) {
      curDate = $item.attr('id')
      curDate = curDate.substr(curDate.indexOf('-') + 1).split('-')
    } else if ($item.hasClass('iq-accordion')) {
      const top = $item.find('.iq-accordion-block')
      const heading = top.find('.iq-accordion-title .big-title')
      if (heading.length) {
        const progId = top.attr('id')
        const title = heading.find('span:eq(1)').text()
          .split('\n')
          .map(a => a.trim())
          .join(' ')
        const time = heading.find('span:eq(0)').text()
        const [d, m, y] = curDate
        items.push({
          program: progId.substr(progId.indexOf('-') + 1),
          title: title ? title.trim() : title,
          start: `${y}-${m}-${d} ${time.trim()}`,
        })
      }
    }
  })
  items.sort((a, b) => a.start.localeCompare(b.start))
  for (let i = 0; i < items.length; i++) {
    if (i < items.length - 2) {
      items[i].stop = items[i + 1].start
    } else {
      const dt = dayjs.tz(items[i].start).add(1, 'd')
      items[i].stop = `${dt.format('YYYY-MM-DD')} 00:00`
    }
  }
  const expectedDate = `${date.format('YYYY-MM-DD')}`
  return items
    .filter(a => a.start.startsWith(expectedDate) || a.stop.startsWith(expectedDate))
    .map(a => {
      a.start = dayjs.tz(a.start, tz)
      a.stop = dayjs.tz(a.stop, tz)
      return a
    })
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
