const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'dstv.com',
  url: function ({ channel, date }) {
    const [region] = channel.site_id.split('#')

    return `https://www.dstv.com/umbraco/api/TvGuide/GetProgrammes?d=${date.format(
      'YYYY-MM-DD'
    )}&country=${region}`
  },
  async parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    for (const item of items) {
      const details = await loadProgramDetails(item)
      programs.push({
        title: item.Title,
        description: details.Synopsis,
        icon: details.ThumbnailUri,
        category: details.SubGenres,
        start: parseStart(item),
        stop: parseStop(item)
      })
    }

    return programs
  },
  async channels({ country }) {
    const data = await axios
      .get(`https://www.dstv.com/umbraco/api/TvGuide/GetChannels?country=${country}`)
      .then(r => r.data)
      .catch(console.log)

    return data.Channels.map(item => {
      return {
        site_id: `${country}#${item.Tag}`,
        name: item.Name
      }
    })
  }
}

async function loadProgramDetails(item) {
  const url = `https://www.dstv.com/umbraco/api/TvGuide/GetProgramme?id=${item.Id}`

  return axios
    .get(url)
    .then(r => r.data)
    .catch(console.error)
}

function parseStart(item) {
  return dayjs.utc(item.StartTime, 'YYYY-MM-DDTHH:mm:ss')
}

function parseStop(item) {
  return dayjs.utc(item.EndTime, 'YYYY-MM-DDTHH:mm:ss')
}

function parseItems(content, channel) {
  const [_, channelId] = channel.site_id.split('#')
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.Channels)) return []
  const channelData = data.Channels.find(c => c.Tag === channelId)
  if (!channelData || !Array.isArray(channelData.Programmes)) return []

  return channelData.Programmes
}
