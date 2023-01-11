const dayjs = require('dayjs')
const axios = require('axios')

module.exports = {
  site: 'tv.movistar.com.pe',
  days: 2,
  url({ channel, date }) {
    return `https://contentapi-pe.cdn.telefonica.com/28/default/es-PE/schedules?fields=Pid,Title,Description,ChannelName,LiveChannelPid,Start,End,images.videoFrame,AgeRatingPid&orderBy=START_TIME%3Aa&filteravailability=false&starttime=${date.unix()}&endtime=${date
      .add(1, 'd')
      .unix()}&livechannelpids=${channel.site_id}`
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.Title,
        description: item.Description,
        icon: parseIcon(item),
        start: parseTime(item.Start),
        stop: parseTime(item.End)
      })
    })

    return programs
  },
  async channels() {
    const items = await axios
      .get(
        `https://contentapi-pe.cdn.telefonica.com/28/default/es-PE/contents/all?contentTypes=LCH&fields=Pid,Name&orderBy=contentOrder&limit=1000`
      )
      .then(r => r.data.Content.List)
      .catch(console.error)

    return items.map(i => {
      return {
        lang: 'es',
        name: i.Name,
        site_id: i.Pid.toLowerCase()
      }
    })
  }
}

function parseIcon(item) {
  return item.Images?.VideoFrame?.[0]?.Url
}

function parseTime(timestamp) {
  return dayjs.unix(timestamp)
}

function parseItems(content, channel) {
  const data = JSON.parse(content)

  return data.Content || []
}
