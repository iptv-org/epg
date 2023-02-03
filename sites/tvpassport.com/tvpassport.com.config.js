const axios = require('axios')
const dayjs = require('dayjs')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

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
      let sub_title = parseSubTitle($item)
      if (title === 'Movie') {
        title = sub_title
        sub_title = null
      }

      programs.push({
        title,
        sub_title,
        description: parseDescription($item),
        icon: parseIcon($item),
        category: parseCategory($item),
        rating: parseRating($item),
        actors: parseActors($item),
        guest: parseGuest($item),
        director: parseDirector($item),
        start,
        stop
      })
    }

    return programs
  },
  async channels() {
    const content = await axios
      .get(`https://www.tvpassport.com/tv-listings`, {
        headers: {
          Cookie: 'cisession=317b3a464bfe449650b7cc4b16ccf900a6646d88;'
        }
      })
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(content)

    return $('.channel_cell')
      .map((i, el) => {
        const site_id = $(el)
          .find('a')
          .attr('href')
          .replace('https://www.tvpassport.com/tv-listings/stations/', '')
        const name = $(el).find('.sr-only').text().trim()

        return {
          site_id,
          name
        }
      })
      .get()
  }
}

function parseDescription($item) {
  return $item('*').data('description')
}

function parseIcon($item) {
  const showpicture = $item('*').data('showpicture')
  const url = new URL(showpicture, 'https://cdn.tvpassport.com/image/show/960x540/')

  return url.href
}

function parseTitle($item) {
  return $item('*').data('showname')
}

function parseSubTitle($item) {
  return $item('*').data('episodetitle')
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

  return $(`.station-listings .list-group-item`).toArray()
}
