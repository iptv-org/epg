const axios = require('axios')
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
  url({ date, channel }) {
    const [region] = channel.site_id.split('#')

    return `https://cdn.iview.abc.net.au/epg/processed/${region}_${date.format('YYYY-MM-DD')}.json`
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
        image: parseImage(item),
        start: parseTime(item.start_time),
        stop: parseTime(item.end_time)
      })
    })

    return programs
  },
  async channels({ region = 'syd' }) {
    const now = dayjs()
    const regions = {
      syd: 'Sydney',
      mel: 'Melbourne',
      bri: 'Brisbane',
      gc: 'GoldCoast',
      per: 'Perth',
      adl: 'Adelaide',
      hbr: 'Hobart',
      drw: 'Darwin',
      cbr: 'Canberra',
      nsw: 'New South Wales',
      vic: 'Victoria',
      tsv: 'Townsville',
      qld: 'Queensland',
      wa: 'Western Australia',
      sa: 'South Australia',
      tas: 'Tasmania',
      nt: 'Northern Territory'
    }

    let channels = []
    const regionName = regions[region]
    const data = await axios
      .get(
        `https://cdn.iview.abc.net.au/epg/processed/${regionName}_${now.format('YYYY-MM-DD')}.json`
      )
      .then(r => r.data)
      .catch(console.log)

    for (let item of data.schedule) {
      channels.push({
        lang: 'en',
        site_id: `${regionName}#${item.channel}`,
        name: item.channel
      })
    }

    return channels
  }
}

function parseItems(content, channel) {
  try {
    const data = JSON.parse(content)
    if (!data) return []
    if (!Array.isArray(data.schedule)) return []

    const [, channelId] = channel.site_id.split('#')
    const channelData = data.schedule.find(i => i.channel == channelId)
    return channelData.listing && Array.isArray(channelData.listing) ? channelData.listing : []
  } catch {
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
function parseImage(item) {
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
