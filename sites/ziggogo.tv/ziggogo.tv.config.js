const axios = require('axios')
const dayjs = require('dayjs')

const API_ENDPOINT = `https://static.spark.ziggogo.tv/eng/web/epg-service-lite`

module.exports = {
  site: 'ziggogo.tv',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url: function ({ date, channel }) {
    return `${API_ENDPOINT}/nl/${channel.lang}/events/segments/${date.format('YYYYMMDDHHmmss')}`
  },
  async parser({ content, channel, date }) {
    let programs = []
    let items = parseItems(content, channel)
    if (!items.length) return programs
    const promises = [
      axios.get(
        `${API_ENDPOINT}/nl/${channel.lang}/events/segments/${date
          .add(6, 'h')
          .format('YYYYMMDDHHmmss')}`,
        {
          responseType: 'arraybuffer'
        }
      ),
      axios.get(
        `${API_ENDPOINT}/nl/${channel.lang}/events/segments/${date
          .add(12, 'h')
          .format('YYYYMMDDHHmmss')}`,
        {
          responseType: 'arraybuffer'
        }
      ),
      axios.get(
        `${API_ENDPOINT}/nl/${channel.lang}/events/segments/${date
          .add(18, 'h')
          .format('YYYYMMDDHHmmss')}`,
        {
          responseType: 'arraybuffer'
        }
      )
    ]

    await Promise.allSettled(promises)
      .then(results => {
        results.forEach(r => {
          if (r.status === 'fulfilled') {
            const parsed = parseItems(r.value.data, channel)

            items = items.concat(parsed)
          }
        })
      })
      .catch(console.error)

    for (let item of items) {
      const detail = await loadProgramDetails(item, channel)
      programs.push({
        title: item.title,
        description: detail.longDescription,
        category: detail.genres,
        actors: detail.actors,
        season: parseSeason(detail),
        episode: parseEpisode(detail),
        start: parseStart(item),
        stop: parseStop(item)
      })
    }

    return programs
  },
  async channels() {
    const data = await axios
      .get(
        `https://prod.spark.ziggogo.tv/eng/web/linear-service/v2/channels?cityId=65535&language=en&productClass=Orion-DASH`
      )
      .then(r => r.data)
      .catch(console.log)

    return data.channels.map(item => {
      return {
        lang: 'be',
        site_id: item.id,
        name: item.name
      }
    })
  }
}

async function loadProgramDetails(item, channel) {
  if (!item.id) return {}
  const url = `https://prod.spark.ziggogo.tv/eng/web/linear-service/v2/replayEvent/${item.id}?returnLinearContent=true&language=${channel.lang}`
  const data = await axios
    .get(url)
    .then(r => r.data)
    .catch(console.log)

  return data || {}
}

function parseStart(item) {
  return dayjs.unix(item.startTime)
}

function parseStop(item) {
  return dayjs.unix(item.endTime)
}

function parseItems(content, channel) {
  if (!content) return []
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.entries)) return []
  const channelData = data.entries.find(e => e.channelId === channel.site_id)
  if (!channelData) return []

  return Array.isArray(channelData.events) ? channelData.events : []
}

function parseSeason(detail) {
  if (!detail.seasonNumber) return null
  if (String(detail.seasonNumber).length > 2) return null
  return detail.seasonNumber
}

function parseEpisode(detail) {
  if (!detail.episodeNumber) return null
  if (String(detail.episodeNumber).length > 3) return null
  return detail.episodeNumber
}
