const dayjs = require('dayjs')

module.exports = {
  site: 'bt.com',
  days: 2,
  request: {
    timeout: 30000
  },
  url: function ({ date, channel }) {
    return `https://voila.metabroadcast.com/4/schedules/${
      channel.site_id
    }.json?key=b4d2edb68da14dfb9e47b5465e99b1b1&from=${date.utc().format()}&to=${date
      .add(1, 'd')
      .utc()
      .format()}&source=api.youview.tv&annotations=content.description`
  },
  parser: function ({ content }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.item.title,
        description: item.item.description,
        icon: parseIcon(item),
        season: parseSeason(item),
        episode: parseEpisode(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  }
}

function parseItems(content) {
  const data = JSON.parse(content)
  return data && data.schedule.entries ? data.schedule.entries : []
}
function parseSeason(item) {
  if (item.item.type !== 'episode') return null
  return item.item.series_number || null
}
function parseEpisode(item) {
  if (item.item.type !== 'episode') return null
  return item.item.episode_number || null
}
function parseIcon(item) {
  return item.item.image || null
}
function parseStart(item) {
  return dayjs(item.broadcast.transmission_time)
}

function parseStop(item) {
  return dayjs(item.broadcast.transmission_end_time)
}
