const axios = require('axios')
const dayjs = require('dayjs')

const API_ENDPOINT = 'https://epg.provider.plex.tv'

module.exports = {
  site: 'plex.tv',
  days: 2,
  request: {
    headers: {
      'x-plex-provider-version': '5.1'
    }
  },
  url: function ({ channel, date }) {
    const [_, channelGridKey] = channel.site_id.split('-')

    return `${API_ENDPOINT}/grid?channelGridKey=${channelGridKey}&date=${date.format('YYYY-MM-DD')}`
  },
  parser({ content }) {
    const programs = []
    const items = parseItems(content)
    for (let item of items) {
      programs.push({
        title: item.title,
        description: item.summary,
        categories: parseCategories(item),
        icon: item.art,
        start: parseStart(item),
        stop: parseStop(item)
      })
    }

    return programs
  },
  async channels({ lang }) {
    const data = await axios
      .get(`${API_ENDPOINT}/lineups/plex/channels?X-Plex-Token=zb85PfdNQLmsry9kQLBR`)
      .then(r => r.data)
      .catch(console.error)

    return data.MediaContainer.Channel.map(c => {
      return {
        site_id: c.id,
        name: c.title
      }
    })
  }
}

function parseCategories(item) {
  return Array.isArray(item.Genre) ? item.Genre.map(g => g.tag) : []
}

function parseStart(item) {
  return item.beginsAt ? dayjs.unix(item.beginsAt) : null
}

function parseStop(item) {
  return item.endsAt ? dayjs.unix(item.endsAt) : null
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !data.MediaContainer || !Array.isArray(data.MediaContainer.Metadata)) return []
  const metadata = data.MediaContainer.Metadata
  const items = []
  metadata.forEach(item => {
    let segments = []
    item.Media.sort(byTime).forEach((media, i) => {
      let prevSegment = segments[segments.length - 1]
      if (prevSegment && prevSegment.endsAt === media.beginsAt) {
        prevSegment.endsAt = media.endsAt
      } else {
        segments.push(media)
      }
    })

    segments.forEach(segment => {
      items.push({ ...item, segments, beginsAt: segment.beginsAt, endsAt: segment.endsAt })
    })
  })

  return items.sort(byTime)

  function byTime(a, b) {
    if (a.beginsAt > b.beginsAt) return 1
    if (a.beginsAt < b.beginsAt) return -1
    return 0
  }
}
