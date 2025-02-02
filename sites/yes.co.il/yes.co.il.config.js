const axios = require('axios')

module.exports = {
  site: 'yes.co.il',
  days: 2,
  url({ channel, date }) {
    return `https://svc.yes.co.il/api/content/broadcast-schedule/channels/${
      channel.site_id
    }?date=${date.format('YYYY-M-D')}&ignorePastItems=true`
  },
  request: {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Linux; Linux x86_64) AppleWebKit/600.3 (KHTML, like Gecko) Chrome/48.0.2544.291 Safari/600'
    }
  },
  parser({ content }) {
    const items = parseItems(content)

    return items.map(item => ({
      title: item.title,
      description: item.description,
      image: item.imageUrl,
      start: item.starts,
      stop: item.ends
    }))
  },
  async channels() {
    const data = await axios
      .get('https://svc.yes.co.il/api/content/broadcast-schedule/channels?page=0&pageSize=1000', {
        headers: {
          'accept-language': 'he-IL',
          'user-agent':
            'Mozilla/5.0 (Linux; Linux x86_64) AppleWebKit/600.3 (KHTML, like Gecko) Chrome/48.0.2544.291 Safari/600'
        }
      })
      .then(r => r.data)
      .catch(console.error)

    return data.items.map(channel => ({
      lang: 'he',
      name: channel.title,
      site_id: channel.channelId
    }))
  }
}

function parseItems(content) {
  try {
    const data = JSON.parse(content)
    if (!data || !Array.isArray(data.items)) return []

    return data.items
  } catch {
    return []
  }
}
