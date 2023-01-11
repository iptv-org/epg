const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'telkku.com',
  days: 2,
  url: function ({ channel, date }) {
    const [group] = channel.site_id.split('#')

    return `https://telkku.com/api/channel-groups/${group}/offering?startTime=00%3A00%3A00.000&duration=PT24H&inclusionPolicy=IncludeOngoingAlso&limit=1000&tvDate=${date.format(
      'YYYY-MM-DD'
    )}&view=PublicationDetails`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = getItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.description,
        icon: getIcon(item),
        start: getStart(item),
        stop: getStop(item)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(`https://telkku.com/api/channel-groups`)
      .then(r => r.data)
      .catch(console.log)

    let items = []
    data.response.forEach(group => {
      group.channels.forEach(channel => {
        items.push({
          lang: 'fi',
          site_id: `${group.id}#${channel.id}`,
          name: channel.name
        })
      })
    })

    return items
  }
}

function getIcon(item) {
  const image = item.images.find(i => i.type === 'default' && i.sizeTag === '1200x630')

  return image ? image.url : null
}

function getStart(item) {
  return dayjs(item.startTime)
}

function getStop(item) {
  return dayjs(item.endTime)
}

function getItems(content, channel) {
  const [_, channelId] = channel.site_id.split('#')
  const data = JSON.parse(content)
  if (!data || !data.response || !Array.isArray(data.response.publicationsByChannel)) return []
  const channelData = data.response.publicationsByChannel.find(i => i.channel.id === channelId)
  if (!channelData || !Array.isArray(channelData.publications)) return []

  return channelData.publications
}
