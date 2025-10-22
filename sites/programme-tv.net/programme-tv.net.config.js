const durationParser = require('parse-duration').default
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'programme-tv.net',
  days: 2,
  request: {
    headers: {
      cookie: 'authId=b7154156fe4fb8acdb6f38e1207c6231'
    }
  },
  url: function ({ date, channel }) {
    return `https://www.programme-tv.net/programme/chaine/${date.format('YYYY-MM-DD')}/programme-${
      channel.site_id
    }.html`
  },
  parser: function ({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const title = parseTitle($item)
      const subTitle = parseSubtitle($item)
      const image = parseImage($item)
      const category = parseCategory($item)
      const start = parseStart($item, date)
      const duration = parseDuration($item)
      const stop = start.add(duration, 'ms')

      programs.push({ title, subTitle, image, category, start, stop })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const data = await axios
      .get(
        `https://www.programme-tv.net/_esi/channel-list/${dayjs().format(
          'YYYY-MM-DD'
        )}/?bouquet=perso&modal=0`,
        {
          headers: {
            cookie: 'authId=b7154156fe4fb8acdb6f38e1207c6231'
          }
        }
      )
      .then(r => r.data)
      .catch(console.error)

    let channels = []

    const $ = cheerio.load(data)
    $('.channelList-listItemsLink').each((i, el) => {
      const name = $(el).attr('title')
      const url = $(el).attr('href')
      const [, site_id] = url.match(/\/programme-(.*)\.html$/i)

      channels.push({
        lang: 'fr',
        site_id,
        name
      })
    })

    return channels
  }
}

function parseStart($item, date) {
  let time = $item('.mainBroadcastCard-startingHour').first().text().trim()
  time = `${date.format('MM/DD/YYYY')} ${time.replace('h', ':')}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Paris')
}

function parseDuration($item) {
  const duration = $item('.mainBroadcastCard-durationContent').first().text().trim()

  return durationParser(duration)
}

function parseImage($item) {
  const img = $item('.mainBroadcastCard-imageContent').first().find('img')
  const value = img.attr('srcset') || img.data('srcset')

  let url = null

  if (value) {
    const sources = value.split(',').map(s => s.trim())
    for (const source of sources) {
      const [src, descriptor] = source.split(/\s+/)
      if (descriptor === '128w') {
        url = src.replace('128x180', '960x540')
        break
      }
    }
  }

  return url
}

function parseCategory($item) {
  return $item('.mainBroadcastCard-format').first().text().trim()
}

function parseTitle($item) {
  return $item('.mainBroadcastCard-title').first().text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('.mainBroadcastCard').toArray()
}

function parseSubtitle($item) {
  return $item('.mainBroadcastCard-subtitle').text().trim() || null
}