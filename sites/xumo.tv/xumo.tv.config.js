const axios = require('axios')
const dayjs = require('dayjs')

const API_ENDPOINT = `https://valencia-app-mds.xumo.com/v2`

const client = axios.create({
  baseURL: API_ENDPOINT,
  responseType: 'arraybuffer'
})

module.exports = {
  site: 'xumo.tv',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url: function ({ date, channel }) {
    const [offset] = channel.site_id.split('#')

    return `${API_ENDPOINT}/epg/10006/${date.format(
      'YYYYMMDD'
    )}/0.json?f=asset.title&f=asset.descriptions&limit=50&offset=${offset}`
  },
  async parser({ content, channel, date }) {
    let programs = []
    let items = parseItems(content, channel)
    if (!items.length) return programs
    const d = date.format('YYYYMMDD')
    const [offset] = channel.site_id.split('#')
    const promises = [
      client.get(
        `/epg/10006/${d}/1.json?f=asset.title&f=asset.descriptions&limit=50&offset=${offset}`
      ),
      client.get(
        `/epg/10006/${d}/2.json?f=asset.title&f=asset.descriptions&limit=50&offset=${offset}`
      ),
      client.get(
        `/epg/10006/${d}/3.json?f=asset.title&f=asset.descriptions&limit=50&offset=${offset}`
      )
    ]
    const results = await Promise.allSettled(promises)
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        items = items.concat(parseItems(r.value.data, channel))
      }
    })

    items.forEach(item => {
      programs.push({
        title: item.title,
        sub_title: item.episodeTitle,
        description: parseDescription(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const channels = await axios
      .get(
        `https://valencia-app-mds.xumo.com/v2/channels/list/10006.json?sort=hybrid&geoId=unknown`
      )
      .then(r => r.data.channel.item)
      .catch(console.log)

    const promises = [
      axios.get(`${API_ENDPOINT}/epg/10006/19700101/0.json?limit=50&offset=0`),
      axios.get(`${API_ENDPOINT}/epg/10006/19700101/0.json?limit=50&offset=50`),
      axios.get(`${API_ENDPOINT}/epg/10006/19700101/0.json?limit=50&offset=100`),
      axios.get(`${API_ENDPOINT}/epg/10006/19700101/0.json?limit=50&offset=150`),
      axios.get(`${API_ENDPOINT}/epg/10006/19700101/0.json?limit=50&offset=200`),
      axios.get(`${API_ENDPOINT}/epg/10006/19700101/0.json?limit=50&offset=250`),
      axios.get(`${API_ENDPOINT}/epg/10006/19700101/0.json?limit=50&offset=300`)
    ]

    const output = []
    const results = await Promise.allSettled(promises)
    results.forEach((r, i) => {
      if (r.status !== 'fulfilled') return

      r.value.data.channels.forEach(item => {
        const info = channels.find(c => c.guid.value == item.channelId)

        if (!info) {
          console.log(item.channelId)
        }

        output.push({
          site_id: `${i * 50}#${item.channelId}`,
          name: info.title
        })
      })
    })

    return output
  }
}

function parseDescription(item) {
  if (!item.descriptions) return null

  return item.descriptions.medium || item.descriptions.small || item.descriptions.tiny
}

function parseStart(item) {
  return dayjs(item.start)
}

function parseStop(item) {
  return dayjs(item.end)
}

function parseItems(content, channel) {
  if (!content) return []
  const [_, channelId] = channel.site_id.split('#')
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.channels)) return []
  const channelData = data.channels.find(c => c.channelId == channelId)
  if (!channelData || !Array.isArray(channelData.schedule)) return []

  return channelData.schedule
    .map(item => {
      const details = data.assets[item.assetId]
      if (!details) return null

      return { ...item, ...details }
    })
    .filter(Boolean)
}
