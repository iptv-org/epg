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
        sub_title: parseSubtitle(item),
        description: parseDescription(item),
        category: parseCategory(item),
        season: parseSeason(item),
        episode: parseEpisode(item),
        directors: parseDirectors(item),
        actors: parseActors(item),
        date: parseDate(item),
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
            xmltv_id: parseChannelId(stationData),
            logo: parseChannelIcon(item)
          }
          break
        default:
          channel = {
            site_id: station.id,
            name: stationData.name,
            logo: parseChannelIcon(item)
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

function parseSubtitle(item) {
  return item.program.episodeTitle
}

function parseDescription(item) {
  return item.program.longDescription
}

function parseCategory(item) {
  return item.program.genres || []
}

function parseSeason(item) {
  return item.program.seasonNum || null
}

function parseEpisode(item) {
  return item.program.episodeNum || null
}

function parseDirectors(item) {
  return item.program.directors || []
}

function parseDate(item) {
  return item.program.origAirDate
}

function parseActors(item) {
  return item.program.topCast || []
}

function parseIcon(item) {
  return item.program.preferredImage && item.program.preferredImage.uri
    ? `https://tvtv.us/gn/i/${item.program.preferredImage.uri}`
    : null
}

function parseChannelIcon(item) {
  return item.station.preferredImage && item.station.preferredImage.uri
    ? `https://tvtv.us/gn/i/${item.station.preferredImage.uri}`
    : null
}
