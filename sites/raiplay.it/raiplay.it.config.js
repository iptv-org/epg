const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

module.exports = {
  site: 'raiplay.it',
  days: 2,
  url: function ({ date, channel }) {
    return `https://www.raiplay.it/palinsesto/app/${channel.site_id}/${date.format(
      'DD-MM-YYYY'
    )}.json`
  },
  parser: function ({ content, date }) {
    const programs = []
    const data = JSON.parse(content)
    if (!data.events) return programs

    data.events.forEach(item => {
      if (!item.name || !item.hour || !item.duration_in_minutes) return
      const start = parseStart(item, date)
      const duration = parseInt(item.duration_in_minutes)
      const stop = start.add(duration, 'm')

      programs.push({
        title: item.name || item.program.name,
        description: item.description,
        season: parseSeason(item),
        episode: parseEpisode(item),
        sub_title: item['episode_title'] || null,
        url: parseURL(item),
        start,
        stop,
        icon: parseIcon(item)
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${item.hour}`, 'YYYY-MM-DD HH:mm', 'Europe/Rome')
}

function parseIcon(item) {
  let cover = null
  if (item.image) {
    cover = `https://www.raiplay.it${item.image}`
  }
  return cover
}

function parseURL(item) {
  let url = null
  if (item.weblink) {
    url = `https://www.raiplay.it${item.weblink}`
  }
  if (item.event_weblink) {
    url = `https://www.raiplay.it${item.event_weblink}`
  }
  return url
}

function parseSeason(item) {
  if (!item.season) return null
  if (String(item.season).length > 2) return null
  return item.season
}

function parseEpisode(item) {
  if (!item.episode) return null
  if (String(item.episode).length > 3) return null
  return item.episode
}
