const dayjs = require('dayjs')

module.exports = {
  site: 'foxsports.com.au',
  days: 3,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ date }) {
    return `https://tvguide.foxsports.com.au/granite-api/programmes.json?from=${date.format(
      'YYYY-MM-DD'
    )}&to=${date.add(1, 'd').format('YYYY-MM-DD')}`
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.programmeTitle,
        sub_title: item.title,
        category: item.genreTitle,
        description: item.synopsis,
        start: dayjs.utc(item.startTime),
        stop: dayjs.utc(item.endTime)
      })
    })

    return programs
  }
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data) return []
  const programmes = data['channel-programme']
  if (!Array.isArray(programmes)) return []

  const channelData = programmes.filter(i => i.channelId == channel.site_id)
  return channelData && Array.isArray(channelData) ? channelData : []
}
