const dayjs = require('dayjs')

module.exports = {
  site: 'tv.nu',
  days: 2,
  url: function ({ channel, date }) {
    return `https://web-api.tv.nu/channels/${channel.site_id}/schedule?date=${date.format(
      'YYYY-MM-DD'
    )}&fullDay=true`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.description,
        icon: item.imageLandscape,
        category: item.genres,
        season: item.seasonNumber || null,
        episode: item.episodeNumber || null,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  }
}

function parseStart(item) {
  if (!item.broadcast || !item.broadcast.startTime) return null

  return dayjs(item.broadcast.startTime)
}

function parseStop(item) {
  if (!item.broadcast || !item.broadcast.endTime) return null

  return dayjs(item.broadcast.endTime)
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !data.data || !Array.isArray(data.data.broadcasts)) return []

  return data.data.broadcasts
}
