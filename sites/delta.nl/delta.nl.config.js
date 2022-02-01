const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'delta.nl',
  url: function ({ channel, date }) {
    return `https://clientapi.tv.delta.nl/guide/channels/list?start=${date.unix()}&end=${date
      .add(1, 'd')
      .unix()}&includeDetails=true&channels=${channel.site_id}`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title,
        icon: item.images.thumbnail.url,
        start: parseStart(item).toJSON(),
        stop: parseStop(item).toJSON()
      })
    })

    return programs
  },
  async channels() {
    const items = await axios
      .get('https://clientapi.tv.delta.nl/channels/list')
      .then(r => r.data)
      .catch(console.log)

    return items
      .filter(i => i.type === 'TV')
      .map(item => {
        return {
          lang: 'nl',
          site_id: item['ID'],
          name: item.name
        }
      })
  }
}

function parseStart(item) {
  return dayjs.unix(item.start)
}

function parseStop(item) {
  return dayjs.unix(item.end)
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data) return []

  return data[channel.site_id] || []
}
