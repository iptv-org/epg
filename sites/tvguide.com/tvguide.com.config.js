const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'tvguide.com',
  days: 2,
  url: function ({ date, channel }) {
    const [providerId, channelSourceIds] = channel.site_id.split('#')
    const url = `https://fandom-prod.apigee.net/v1/xapi/tvschedules/tvguide/${providerId}/web?start=${date
      .startOf('d')
      .unix()}&duration=1440&channelSourceIds=${channelSourceIds}`

    return url
  },
  async parser({ content, channel }) {
    const programs = []
    const items = parseItems(content)
    for (let item of items) {
      const details = await loadProgramDetails(item)
      programs.push({
        title: item.title,
        sub_title: details.episodeTitle,
        description: details.description,
        season: details.seasonNumber,
        episode: details.episodeNumber,
        rating: parseRating(item),
        categories: parseCategories(details),
        start: parseTime(item.startTime),
        stop: parseTime(item.endTime)
      })
    }

    return programs
  }
}

function parseRating(item) {
  return item.rating ? { system: 'MPA', value: item.rating } : null
}

function parseCategories(details) {
  return Array.isArray(details.genres) ? details.genres.map(g => g.name) : []
}

function parseTime(timestamp) {
  return dayjs.unix(timestamp)
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data.data || !Array.isArray(data.data.items) || !data.data.items.length) return []

  return data.data.items[0].programSchedules
}

async function loadProgramDetails(item) {
  const data = await axios
    .get(item.programDetails)
    .then(r => r.data)
    .catch(err => {
      console.log(err.message)
    })
  if (!data || !data.data || !data.data.item) return {}

  return data.data.item
}
