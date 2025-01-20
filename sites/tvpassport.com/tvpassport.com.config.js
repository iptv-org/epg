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

module.exports = {
  site: 'tvpassport.com',
  days: 3,
  url({ channel, date }) {
    return `https://www.tvpassport.com/tv-listings/stations/${channel.site_id}/${date.format(
      'YYYY-MM-DD'
    )}`
  },
  request: {
    timeout: 30000,
    headers: {
      Cookie: 'cisession=e49ff13191d6875887193cae9e324b44ef85768d;'
    }
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    for (let item of items) {
      const $item = cheerio.load(item)
      const start = parseStart($item)
      const duration = parseDuration($item)
      const stop = start.add(duration, 'm')
      let title = parseTitle($item)
      let subtitle = parseSubTitle($item)
      if (title === 'Movie') {
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

      const [, site_id] = url.match(/\/tv-listings\/stations\/(.*)$/)

      console.log(`[${i}/${total}]`, url)

      await wait(1000)

      const $channelPage = cheerio.load(res)
      const title = $channelPage('meta[property="og:title"]').attr('content')
      const name = title.replace('TV Schedule for ', '')

      channels.push({
        lang: 'en',
        site_id,
        name
      })

      i++
    })

    return channels
  }
}

function parseDescription($item) {
  return $item('*').data('description')
}

function parseImage($item) {
  const showpicture = $item('*').data('showpicture')
  const url = new URL(showpicture, 'https://cdn.tvpassport.com/image/show/960x540/')

  return url.href
}

function parseTitle($item) {
  return $item('*').data('showname').toString()
}

function parseSubTitle($item) {
  return $item('*').data('episodetitle').toString() || null
}

function parseYear($item) {
  return $item('*').data('year').toString() || null
}

function parseCategory($item) {
  const showtype = $item('*').data('showtype')

  return showtype ? showtype.split(', ') : []
}

function parseActors($item) {
  const cast = $item('*').data('cast')

  return cast ? cast.split(', ') : []
}

function parseDirector($item) {
  const director = $item('*').data('director')

  return director ? director.split(', ') : []
}

function parseGuest($item) {
  const guest = $item('*').data('guest')

  return guest ? guest.split(', ') : []
}

function parseRating($item) {
  const rating = $item('*').data('rating')

  return rating
    ? {
        system: 'MPA',
        value: rating.replace(/^TV/, 'TV-')
      }
    : null
}

function parseStart($item) {
  const time = $item('*').data('st')

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm:ss', 'America/New_York')
}

function parseDuration($item) {
  const duration = $item('*').data('duration')

  return parseInt(duration)
}

function parseItems(content) {
  if (!content) return []
  const $ = cheerio.load(content)

  return $('.station-listings .list-group-item').toArray()
}
