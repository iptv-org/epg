const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'dstv.com',
  request: {
    cache: {
      ttl: 6 * 60 * 60 * 1000, // 6h
      interpretHeader: false
    }
  },
  url: function ({ channel, date }) {
    const [region] = channel.site_id.split('#')
    const packageName = region === 'nga' ? 'DStv%20Premium' : ''

    return `https://www.dstv.com/umbraco/api/TvGuide/GetProgrammes?d=${date.format(
      'YYYY-MM-DD'
    )}&package=${packageName}&country=${region}`
  },
  async parser({ content, channel, cached }) {
    let programs = []
    const items = parseItems(content, channel)
    for (const item of items) {
      const details = await loadProgramDetails(item)
      programs.push({
        title: item.Title,
        description: parseDescription(details),
        icon: parseIcon(details),
        category: parseCategory(details),
        start: parseTime(item.StartTime),
        stop: parseTime(item.EndTime)
      })
    }

    return programs
  },
  async channels({ country }) {
    const data = await axios
      .get(
        `https://www.dstv.com/umbraco/api/TvGuide/GetProgrammes?d=2022-03-10&package=DStv%20Premium&country=${country}`
      )
      .then(r => r.data)
      .catch(console.log)

    return data.Channels.map(item => {
      return {
        site_id: `${country}#${item.Number}`,
        name: item.Name
      }
    })
  }
}

function parseDescription(details) {
  return details ? details.Synopsis : null
}

function parseIcon(details) {
  return details ? details.ThumbnailUri : null
}

function parseCategory(details) {
  return details ? details.SubGenres : null
}

async function loadProgramDetails(item) {
  const url = `https://www.dstv.com/umbraco/api/TvGuide/GetProgramme?id=${item.Id}`

  return axios
    .get(url)
    .then(r => r.data)
    .catch(console.error)
}

function parseTime(time) {
  return dayjs.utc(time, 'YYYY-MM-DDTHH:mm:ss')
}

function parseItems(content, channel) {
  const [_, channelId] = channel.site_id.split('#')
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.Channels)) return []
  const channelData = data.Channels.find(c => c.Number === channelId)
  if (!channelData || !Array.isArray(channelData.Programmes)) return []

  return channelData.Programmes
}
