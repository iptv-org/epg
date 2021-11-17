const axios = require('axios')
const dayjs = require('dayjs')

const domains = {
  rs: '',
  mk: '/mk',
  me: '/me',
  ba: '/ba'
}

module.exports = {
  site: 'tvarenasport.com',
  url: function ({ channel, date }) {
    const [country] = channel.site_id.split('#')

    return `https://www.tvarenasport.com${domains[country]}/api/schedule?date=${date.format(
      'DD-MM-YYYY'
    )}`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title.trim(),
        category: item.league,
        description: item.sport.trim(),
        start: dayjs(item.start),
        stop: dayjs(item.end)
      })
    })

    return programs
  },
  async channels({ country, lang }) {
    const data = await axios
      .get(`https://www.tvarenasport.com${domains[country]}/api/schedule`)
      .then(r => r.data)
      .catch(console.log)

    const channels = []
    for (let id in data.channels) {
      const item = data.channels[id]
      channels.push({
        lang: 'sr',
        site_id: `${country}#${id}`,
        name: item.name
      })
    }

    return channels
  }
}

function parseItems(content, channel) {
  const [_, channelId] = channel.site_id.split('#')
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.items)) return []

  return data.items.filter(i => i.group === channelId)
}
