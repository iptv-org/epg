const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'abc.net.au',
  days: 3,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ date }) {
    return `https://epg.abctv.net.au/processed/Sydney_${date.format('YYYY-MM-DD')}.json`
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title,
        sub_title: item.episode_title,
        category: item.genres,
        description: item.description,
        season: parseSeason(item),
        episode: parseEpisode(item),
        rating: parseRating(item),
        icon: parseIcon(item),
        start: parseTime(item.start_time),
        stop: parseTime(item.end_time)
      })
    })

    return programs
  }
}

function parseItems(content, channel) {
  try {
    const data = JSON.parse(content)
    if (!data) return []
    if (!Array.isArray(data.schedule)) return []

    const channelData = data.schedule.find(i => i.channel == channel.site_id)
    return channelData.listing && Array.isArray(channelData.listing) ? channelData.listing : []
  } catch (err) {
    return []
  }
}

function parseSeason(item) {
  return item.series_num || null
}
function parseEpisode(item) {
  return item.episode_num || null
}
function parseTime(time) {
  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Australia/Sydney')
}
function parseIcon(item) {
  return item.image_file
    ? `https://www.abc.net.au/tv/common/images/publicity/${item.image_file}`
    : null
}
function parseRating(item) {
  return item.rating
    ? {
        system: 'ACB',
        value: item.rating
      }
    : null
}
