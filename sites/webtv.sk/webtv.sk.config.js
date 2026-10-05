const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'webtv.sk',
  days: 2,
  delay: 1000,
  url: 'https://api.webtv.sk/epg/channel',
  request: {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    data({ channel, date }) {
      return {
        channel_id: channel.site_id,
        date: dayjs.utc(date).toJSON()
      }
    }
  },
  parser({ content }) {
    return parseItems(content).map(item => {
      return {
        title: item.Title,
        subtitle: item.Subtitle,
        description: item.Description,
        categories: item.Genres,
        start: dayjs(item.Start),
        stop: dayjs(item.Stop)
      }
    })
  },
  async channels() {
    const data = await axios
      .post(
        'https://api.webtv.sk/channels',
        { type: 'TV', channels_content: null },
        {
          headers: {
            'content-type': 'application/json'
          }
        }
      )
      .then(r => r.data)
      .catch(console.error)

    let channels = []
    for (const site_id in data.data) {
      const channel = data.data[site_id]

      channels.push({
        site_id,
        name: channel.name,
        lang: 'sk'
      })
    }

    return channels
  }
}

function parseItems(content) {
  try {
    const data = JSON.parse(content)
    if (!data || !Array.isArray(data.content)) return []

    return data.content
  } catch {
    return []
  }
}
