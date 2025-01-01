const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'programetv.ro',
  days: 2,
  url: function ({ date, channel }) {
    const daysOfWeek = {
      0: 'duminica',
      1: 'luni',
      2: 'marti',
      3: 'miercuri',
      4: 'joi',
      5: 'vineri',
      6: 'sambata'
    }
    const day = date.day()

    return `https://www.programetv.ro/program-tv/${channel.site_id}/${daysOfWeek[day]}/`
  },
  parser: function ({ content }) {
    let programs = []
    const data = parseContent(content)
    if (!data || !data.shows) return programs
    const items = data.shows
    items.forEach(item => {
      programs.push({
        title: item.title,
        sub_title: item.titleOriginal,
        description: item.desc || item.obs,
        category: item.categories,
        season: item.season || null,
        episode: item.episode || null,
        start: parseStart(item),
        stop: parseStop(item),
        url: item.url || null,
        date: item.date,
        rating: parseRating(item),
        directors: parseDirector(item),
        actors: parseActor(item),
        icon: item.icon
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const data = await axios
      .get('https://www.programetv.ro/api/station/index/')
      .then(r => r.data)
      .catch(console.log)

    return data.map(item => {
      return {
        lang: 'ro',
        site_id: item.slug,
        name: item.displayName
      }
    })
  }
}

function parseStart(item) {
  return dayjs(item.start).toJSON()
}

function parseStop(item) {
  return dayjs(item.stop).toJSON()
}

function parseContent(content) {
  const [, data] = content.match(/var pageData = ({.+});\n/) || [null, null]

  return data ? JSON.parse(data) : {}
}

function parseDirector(item) {
  return item.credits && item.credits.director ? item.credits.director : null
}

function parseActor(item) {
  return item.credits && item.credits.actor ? item.credits.actor : null
}

function parseRating(item) {
  return item.rating
    ? {
        system: 'CNC',
        value: item.rating.toUpperCase()
      }
    : null
}
