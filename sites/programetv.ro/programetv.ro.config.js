const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'programetv.ro',
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

    return `https://www.programetv.ro/post/${channel.site_id}/${daysOfWeek[day]}/`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const data = parseContent(content)
    if (!data || !data.shows) return programs
    const items = data.shows
    items.forEach(item => {
      programs.push({
        title: parseTitle(item, channel),
        sub_title: item.subTitle || null,
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
  }
}

function parseStart(item) {
  return dayjs(item.start).toJSON()
}

function parseStop(item) {
  return dayjs(item.stop).toJSON()
}

function parseContent(content) {
  const [_, data] = content.match(/var pageData = ((.|[\r\n])+);\n/) || [null, null]

  return data ? JSON.parse(data) : {}
}

function parseTitle(item, channel) {
    return (channel.lang === 'ro' || !item.titleOriginal) ? item.title : item.titleOriginal
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
