const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'tvtv.us',
  ignore: false, // NOTE: site_id of most channels must be re-mapped
  url: function ({ date, channel }) {
    return `https://www.tvtv.us/gn/d/v1.1/stations/${
      channel.site_id
    }/airings?startDateTime=${date.format()}&endDateTime=${date.add(1, 'd').format()}`
  },
  logo({ channel }) {
    return channel.logo
  },
  parser: function ({ content }) {
    let programs = []

    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: parseTitle(item),
        description: parseDescription(item),
        category: parseCategory(item),
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
    const data = await axios
      .get(`https://www.tvtv.${country}/api/stations`)
      .then(r => r.data)
      .catch(console.log)

    return data.data
      .filter(i => ['Satellite'].includes(i.type))
      .map(item => {
        return {
          lang: 'en',
          site_id: item.id,
          xmltv_id: item.shortName,
          name: item.name,
          logo: item.logo
        }
      })
  }
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

function parseIcon(item) {
  return item.program.preferredImage && item.program.preferredImage.uri
    ? `http://tvtv.tmsimg.com/${item.program.preferredImage.uri}`
    : null
}
