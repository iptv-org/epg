const axios = require('axios')
const dayjs = require('dayjs')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const doFetch = require('@ntlab/sfetch')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const headers = {}

module.exports = {
  site: 'tvpassport.com',
  days: 3,
  async url({ channel, date }) {
    return await getSiteUrl(channel, date.format('YYYY-MM-DD'))
  },
  request: {
    timeout: 30000,
    headers
  },
  parser({ content }) {
    const programs = []
    const [$, tz, items] = parseItems(content)
    for (const item of items) {
      const $item = $(item)
      const start = parseStart($item, tz)
      const duration = parseDuration($item)
      const stop = start.add(duration, 'm')
      let title = parseTitle($item)
      let subtitle = parseSubTitle($item)
      if (title === 'Movie' || title === 'Cinéma') {
        title = subtitle
        subtitle = null
      }

      programs.push({
        title,
        subtitle,
        description: parseDescription($item),
        image: parseImage($item),
        category: parseCategory($item),
        rating: parseRating($item),
        actors: parseActors($item),
        guest: parseGuest($item),
        director: parseDirector($item),
        year: parseYear($item),
        start,
        stop
      })
    }

    return programs
  },
  async channels() {
    const FRENCH_CHANNELS = require('./__data__/frenchChannels.js')

    function wait(ms) {
      return new Promise(resolve => {
        setTimeout(resolve, ms)
      })
    }

    const xml = await axios
      .get('https://www.tvpassport.com/sitemap.stations.xml')
      .then(r => r.data)
      .catch(console.error)

    const $ = cheerio.load(xml)

    const elements = $('loc').toArray()
    const queue = elements.map(el => $(el).text())
    const total = queue.length

    let i = 1
    const channels = []

    await doFetch(queue, async (url, res) => {
      if (!res) return

      const site_id = getSiteId(url)

      console.log(`[${i}/${total}]`, url)

      await wait(1000)

      const $channelPage = cheerio.load(res)
      const title = $channelPage('meta[property="og:title"]').attr('content')
      const name = title.replace('TV Schedule for ', '')
      const lang = FRENCH_CHANNELS.has(site_id) ? 'fr' : 'en'

      channels.push({
        lang,
        site_id,
        name
      })

      i++
    })

    return channels
  }
}

async function getSiteUrl(channel, date) {
  const f = () =>
    `https://www.tvpassport.com/tv-listings/stations/${channel.site_id}/${date}`
  let url = f()
  const res = await axios.head(url, { headers })
    .then(res => saveCookies(res))
    .then(res => res?.request?.res?.responseUrl)
    .catch(console.error)
  if (res && res !== url) {
    channel.site_id = getSiteId(res)
    url = f()
  }

  return url
}

function getSiteId(url) {
  const [, site_id] = url.match(/\/tv-listings\/stations\/(.*)$/)

  return site_id
}

function saveCookies(res) {
  if (res.headers && Array.isArray(res.headers['set-cookie'])) {
    const cookies = []
    cookies.push(...res.headers['set-cookie']
      .map(cookie => cookie.split(';')[0].trim()))
    headers.Cookie = cookies.length ? cookies.join('; ') : null
  }

  return res
}

function parseDescription($item) {
  return $item.data('description')
}

function parseImage($item) {
  const showpicture = $item.data('showpicture')
  const url = new URL(showpicture, 'https://cdn.tvpassport.com/image/show/960x540/')

  return url.href
}

function parseTitle($item) {
  return $item.data('showname').toString()
}

function parseSubTitle($item) {
  return $item.data('episodetitle')?.toString() || null
}

function parseYear($item) {
  return $item.data('year')?.toString() || null
}

function parseCategory($item) {
  const showtype = $item.data('showtype')

  return showtype ? showtype.split(', ') : []
}

function parseActors($item) {
  const cast = $item.data('cast')

  return cast ? cast.split(', ') : []
}

function parseDirector($item) {
  const director = $item.data('director')

  return director ? director.split(', ') : []
}

function parseGuest($item) {
  const guest = $item.data('guest')

  return guest ? guest.split(', ') : []
}

function parseRating($item) {
  const rating = $item.data('rating')

  return rating
    ? {
        system: 'MPA',
        value: rating.replace(/^TV/, 'TV-')
      }
    : null
}

function parseStart($item, currentTimezone) {
  const time = $item.data('st')

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm:ss', currentTimezone)
}

function parseDuration($item) {
  const duration = $item.data('duration')

  return parseInt(duration)
}

function parseItems(content) {
  if (!content) return [null, null, []]
  const $ = cheerio.load(content)

  return [
    $,
    $('#timezone_selector').val() || 'America/New_York',
    $('.station-listings .list-group-item').toArray()
  ]
}
