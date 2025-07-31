const dayjs = require('dayjs')

module.exports = {
  site: 'allente.fi',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ date }) {
    return `https://cs-vcb.allente.fi/epg/events?date=${date.format('YYYY-MM-DD')}`
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      if (!item.details) return
      const start = dayjs(item.time)
      const stop = start.add(item.details.duration, 'm')
      programs.push({
        title: item.title,
        category: item.details.categories,
        description: item.details.description,
        image: item.details.image,
        season: parseSeason(item),
        episode: parseEpisode(item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const data = await axios
      .get(`https://cs-vcb.allente.fi/epg/events?date=${dayjs().format('YYYY-MM-DD')}`)
      .then(r => r.data)
      .catch(console.log)

    return data.channels.map(item => {
      return {
        lang: 'fi',
        site_id: item.id,
        name: item.name
      }
    })
  }
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.channels)) return []
  const channelData = data.channels.find(i => i.id === channel.site_id)

  return channelData && Array.isArray(channelData.events) ? channelData.events : []
}

function parseSeason(item) {
  return item.details.season || null
}
function parseEpisode(item) {
  return item.details.episode || null
}
