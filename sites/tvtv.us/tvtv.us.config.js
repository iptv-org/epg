const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'tvtv.us',
  url: function ({ date, channel }) {
    return `https://www.tvtv.us/gn/d/v1.1/stations/${
      channel.site_id
    }/airings?startDateTime=${date.format()}&endDateTime=${date.add(1, 'd').format()}`
  },
  parser: function ({ content }) {
    let programs = []

    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: parseTitle(item),
        sub-title: parseSubTitle(item),
        description: parseDescription(item),
        category: parseCategory(item),
        rating: parseRating(item),
        credits: parseCredits(item),
        season: parseSeason(item),
        episode: parseEpisode(item),
        start: parseStart(item),
        stop: parseStop(item),
        icon: parseIcon(item)
      })
    })

    return programs
  },
  async channels({ country }) {
    const channels = []

    const data = await axios
      .get(`https://www.tvtv.${country}/api/stations`)
      .then(r => r.data)
      .catch(console.log)

    const stations = data.data.filter(i => !['Radio Station'].includes(i.type))
    for (const station of stations) {
      const stationData = await axios
        .get(`https://www.tvtv.us/gn/d/v1.1/stations/${station.id}`)
        .then(r => r.data[0] || {})
        .catch(console.log)
      if (!stationData) continue

      let channel
      switch (stationData.type) {
        case 'Low Power Broadcast':
        case 'Full Power Broadcast':
          channel = {
            site_id: station.id,
            name: stationData.name,
            xmltv_id: parseChannelId(stationData)
          }
          break
        default:
          channel = {
            site_id: station.id,
            name: stationData.name
          }
          break
      }

      if (channel) {
        channels.push(channel)
      }
    }

    return channels
  }
}

function parseChannelId(data) {
  if (!data.callSign) return null
  if (/^((CB|C[F-K]|V[A-G]|VO|VX|VY|X[J-O])[0-9A-Z-]+)/.test(data.callSign))
    return `${data.callSign}.ca`
  if (/^((XH|XE)[0-9A-Z-]+)/.test(data.callSign)) return `${data.callSign}.mx`
  if (/^((K|N|W)[0-9A-Z-]+)/.test(data.callSign)) return `${data.callSign}.us`

  return null
}

function parseItems(content) {
  return JSON.parse(content)
}

function parseStart(item) {
  return dayjs(item.startTime)
}

function parseStop(item) {
  return dayjs(item.endTime)
}

function parseTitle(item) {
  return item.program.title
}

function parseSubTitle(item) {
  return item.program.episodeTitle
}

function parseDescription(item) {
  return item.program.longDescription
}

function parseCategory(item) {
  return item.program.genres || []
}

function parseRating(item) {
  return item.program.ratings || []
}

function parseCredits(item) {
  return item.program.topCast || []
}

function parseSeason(item) {
  return item.program.seasonNum || null
}

function parseEpisode(item) {
  return item.program.episodeNum || null
}

function parseIcon(item) {
  return item.program.preferredImage && item.program.preferredImage.uri
    ? `http://tvtv.tmsimg.com/${item.program.preferredImage.uri}`
    : null
}
