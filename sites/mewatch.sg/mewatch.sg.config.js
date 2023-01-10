const dayjs = require('dayjs')

module.exports = {
  site: 'mewatch.sg',
  days: 2,
  url: function ({ channel, date }) {
    return `https://cdn.mewatch.sg/api/schedules?channels=${channel.site_id}&date=${date.format(
      'YYYY-MM-DD'
    )}&duration=24&ff=idp,ldp,rpt,cd&hour=21&intersect=true&lang=en&segments=all`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const info = item.item
      programs.push({
        title: info.title,
        description: info.description,
        icon: info.images.tile,
        episode: info.episodeNumber,
        season: info.seasonNumber,
        start: parseStart(item),
        stop: parseStop(item),
        rating: parseRating(info)
      })
    })

    return programs
  }
}

function parseStart(item) {
  return dayjs(item.startDate)
}

function parseStop(item) {
  return dayjs(item.endDate)
}

function parseRating(info) {
  const classification = info.classification
  if (classification && classification.code) {
    const [_, system, value] = classification.code.match(/^([A-Z]+)\-([A-Z0-9]+)/) || [
      null,
      null,
      null
    ]

    return { system, value }
  }

  return null
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data)) return []
  const channelData = data.find(i => i.channelId === channel.site_id)

  return channelData && Array.isArray(channelData.schedules) ? channelData.schedules : []
}
