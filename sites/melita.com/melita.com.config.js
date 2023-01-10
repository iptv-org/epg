const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'melita.com',
  days: 2,
  url: function ({ channel, date }) {
    return `https://androme.melitacable.com/api/epg/v1/schedule/channel/${
      channel.site_id
    }/from/${date.format('YYYY-MM-DDTHH:mmZ')}/until/${date
      .add(1, 'd')
      .format('YYYY-MM-DDTHH:mmZ')}`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.shortSynopsis,
        icon: parseIcon(item),
        category: item.tags,
        season: item.season,
        episode: item.episode,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const channels = await axios
      .get('https://androme.melitacable.com/api/epg/v2/channel')
      .then(r => r.data)
      .catch(console.log)

    return channels
      .filter(i => !i.audioOnly && i.enabled)
      .map(i => {
        return {
          name: i.name,
          site_id: i.id
        }
      })
  }
}

function parseStart(item) {
  if (!item.published || !item.published.start) return null

  return dayjs(item.published.start)
}

function parseStop(item) {
  if (!item.published || !item.published.end) return null

  return dayjs(item.published.end)
}

function parseIcon(item) {
  return item.posterImage ? item.posterImage + '?form=epg-card-6' : null
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (
    !data ||
    !data.schedules ||
    !data.programs ||
    !data.seasons ||
    !data.series ||
    !Array.isArray(data.schedules)
  )
    return []

  return data.schedules
    .map(i => {
      const program = data.programs.find(p => p.id === i.program) || {}
      if (!program.season) return null
      const season = data.seasons.find(s => s.id === program.season) || {}
      if (!season.series) return null
      const series = data.series.find(s => s.id === season.series)

      return { ...i, ...program, ...season, ...series }
    })
    .filter(i => i)
}
