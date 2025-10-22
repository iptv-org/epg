const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'opto.sic.pt',
  days: 2,
  url({ date, channel }) {
    const startDate = date.unix()
    const endDate = date.add(1, 'd').unix()

    return `https://opto.sic.pt/api/v1/content/epg?startDate=${startDate}&endDate=${endDate}&channels=${channel.site_id}`
  },
  parser({ content }) {
    let programs = []
    let items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        episode: item.episode_number || null,
        season: item.season_number || null,
        start: dayjs.unix(item.start_time),
        stop: dayjs.unix(item.end_time)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get('https://opto.sic.pt/api/v1/content/channel')
      .then(r => r.data)
      .catch(console.error)

    return data.map(channel => {
      return {
        lang: 'pt',
        site_id: channel.id,
        name: channel.name
      }
    })
  }
}

function parseItems(content) {
  try {
    const data = JSON.parse(content)
    if (!Array.isArray(data)) return []

    return data
  } catch {
    return []
  }
}
