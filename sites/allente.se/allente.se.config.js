const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'allente.se',
  days: 2,
  url({ date, channel }) {
    const [country] = channel.site_id.split('#')

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
        icon: item.details.image,
        season: parseSeason(item),
        episode: parseEpisode(item),
        start,
        stop
      })
    })

    return programs
  },
  async channels({ country, lang }) {
    const data = await axios
      .get(`https://cs-vcb.allente.${country}/epg/events?date=2021-11-17`)
      .then(r => r.data)
      .catch(console.log)

    return data.channels.map(item => {
      return {
        lang,
        site_id: `${country}#${item.id}`,
        name: item.name
      }
    })
  }
}

function parseItems(content, channel) {
  const [_, channelId] = channel.site_id.split('#')
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.channels)) return []
  const channelData = data.channels.find(i => i.id === channelId)

  return channelData && Array.isArray(channelData.events) ? channelData.events : []
}

function parseSeason(item) {
  return item.details.season || null
}
function parseEpisode(item) {
  return item.details.episode || null
}
