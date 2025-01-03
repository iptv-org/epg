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
        category: Array.isArray(item.genres) ? item.genres.map(genre => genre.name) : null,
        season: item.seasonNumber || null,
        episode: item.episodeNumber || null,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const channels = []
    const axios = require('axios')
    const result = await axios
      .get('https://www.tv.nu/alla-kanaler')
      .then(response => response.data)
      .catch(console.error)

    if (result) {
      const [, data] = result.match(/\\"allModules\\":(\[(.*?)\])/i) || [null, null]
      const modules = JSON.parse(data.replace(/\\/g, ''))
      if (Array.isArray(modules) && modules.length) {
        let offset = 0
        while (offset !== undefined) {
          const data = await axios
            .get('https://web-api.tv.nu/tableauLinearChannels', {
              params: {
                modules,
                date: dayjs().format('YYYY-MM-DD'),
                limit: 12,
                offset
              }
            })
            .then(r => r.data)
            .catch(console.error)

          data.data.modules.forEach(item => {
            channels.push({
              lang: 'sv',
              name: item.content.name,
              site_id: item.content.slug
            })
          })
          offset = data.data.nextOffset
        }
      }
    }

    return channels
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
