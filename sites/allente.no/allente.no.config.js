const dayjs = require('dayjs')

module.exports = {
  site: 'allente.no',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ channel, date }) {
    const country = channel.site_id.split('#')[0]
    return `https://cs-vcb.allente.${country}/epg/events?date=${date.format('YYYY-MM-DD')}`
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
  async channels({ country }) {
    const axios = require('axios')
    const date = dayjs().format('YYYY-MM-DD')

    const res = await axios.get(`https://cs-vcb.allente.${country}/epg/events?date=${date}`)
    const data = res.data
    if (!data || !Array.isArray(data.channels)) return []

    const lang = country === 'dk' ? 'da' : country

    return data.channels.map(item => ({
      lang: lang,
      site_id: `${country}#${item.id}`,
      name: item.name
    }))
  }
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.channels)) return []
  const channelId = (channel.site_id || '').split('#')[1] || channel.site_id
  const channelData = data.channels.find(i => i.id === channelId)

  return channelData && Array.isArray(channelData.events) ? channelData.events : []
}

function parseSeason(item) {
  return item.details.season || null
}
function parseEpisode(item) {
  return item.details.episode || null
}
