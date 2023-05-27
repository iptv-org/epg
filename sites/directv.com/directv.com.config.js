const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'directv.com',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    },
    headers: {
      'Accept-Language':'en-US,en;q=0.5',
      'Connection':'keep-alive',
    },
  },
  url({ date, channel }) {
    const [channelId, childId] = channel.site_id.split('#')
    return `https://www.directv.com/json/channelschedule?channels=${
      channelId
    }&startTime=${date.format()}&hours=24&chId=${
      childId
    }`
  },
  async parser({ content, channel }) {
    const programs = []
    const items = parseItems(content, channel)
    for (let item of items) {
      if (item.programID === '-1') continue
      const detail = await loadProgramDetail(item.programID)
      const start = parseStart(item)
      const stop = start.add(item.duration, 'm')
      programs.push({
        title: item.title,
        sub_title: item.episodeTitle,
        description: parseDescription(detail),
        rating: parseRating(item),
        date: parseYear(detail),
        category: item.subcategoryList,
        season: item.seasonNumber,
        episode: item.episodeNumber,
        icon: parseIcon(item),
        start,
        stop
      })
    }

    return programs
  },
  async channels({ zip }) {
    const html = await axios
      .get(`https://www.directv.com/guide`, {
        headers: {
          cookie: `dtve-prospect-zip=${zip}`
        }
      })
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(html)
    const script = $('#dtvClientData').html()
    const [_, json] = script.match(/var dtvClientData = (.*);/) || [null, null]
    const data = JSON.parse(json)

    let items = data.guideData.channels

    return items.map(item => {
      return {
        lang: 'en',
        site_id: item.chNum,
        name: item.chName
      }
    })
  }
}

function parseDescription(detail) {
  return detail ? detail.description : null
}
function parseYear(detail) {
  return detail ? detail.releaseYear : null
}
function parseRating(item) {
  return item.rating
    ? {
        system: 'MPA',
        value: item.rating
      }
    : null
}
function parseIcon(item) {
  return item.primaryImageUrl ? `https://www.directv.com${item.primaryImageUrl}` : null
}
function loadProgramDetail(programID) {
  return axios
    .get(`https://www.directv.com/json/program/flip/${programID}`)
    .then(r => r.data)
    .then(d => d.programDetail)
    .catch(console.err)
}

function parseStart(item) {
  return dayjs.utc(item.airTime)
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data) return []
  if (!Array.isArray(data.schedule)) return []

  const [, childId] = channel.site_id.split('#')
  const channelData = data.schedule.find(i => i.chId == childId)
  return channelData.schedules && Array.isArray(channelData.schedules) ? channelData.schedules : []
}
