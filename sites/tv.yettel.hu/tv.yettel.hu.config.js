const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'tv.yettel.hu',
  days: 2,
  url: function ({ channel, date }) {
    return `https://dev.mytvback.com/api/19/default/hu-HU/schedules?livechannelpids=${
      channel.site_id
    }&includeImages=cover%3A100%3A144&filterAvailability=false&startTime=${date.unix()}&endTime=${date
      .add(1, 'd')
      .unix()}`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.Title,
        description: item.ShortDescription,
        icon: parseIcon(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(`https://dev.mytvback.com/api/19/default/hu-HU/content/CHA_LIVE_MYTV2_HU/children`)
      .then(r => r.data)
      .catch(console.log)

    const channels = []
    for (let item of data.Content.List) {
      channels.push({
        lang: 'hu',
        site_id: item.Pid,
        name: item.CallLetter
      })
    }

    return channels
  }
}

function parseIcon(item) {
  if (Array.isArray(item.Images.Cover) && item.Images.Cover.length) {
    return item.Images.Cover[0].Url
  }

  return null
}

function parseStart(item) {
  return dayjs.unix(item.Start)
}

function parseStop(item) {
  return dayjs.unix(item.End)
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.Content)) return []

  return data.Content
}
