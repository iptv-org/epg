const axios = require('axios')

module.exports = {
  site: 'tataplay.com',
  days: 1,

  url({ channel, date }) {
    return `https://tm.tapi.videoready.tv/content-detail/pub/api/v2/channels/schedule?date=${date.format('DD-MM-YYYY')}`
  },

  request: {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Origin': 'https://watch.tataplay.com',
      'Referer': 'https://watch.tataplay.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'content-type': 'application/json',
      'locale': 'ENG',
      'platform': 'web'
    },
    data({ channel }) {
      return { id: channel.site_id }
    }
  },

  parser({ content }) {
    const data = JSON.parse(content)
    const programs = data?.data?.epg || []

    return programs.map(program => ({
      title: program.title,
      start: program.startTime,
      stop: program.endTime,
      description: program.desc,
      category: program.category,
      icon: program.boxCoverImage
    }))
  },

  async channels() {
    const headers = {
      'Accept': '*/*',
      'Origin': 'https://watch.tataplay.com',
      'Referer': 'https://watch.tataplay.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'content-type': 'application/json',
      'locale': 'ENG',
      'platform': 'web'
    }

    const initialResponse = await axios.get(
      'https://tm.tapi.videoready.tv/portal-search/pub/api/v1/channels/schedule?date=&languageFilters=&genreFilters=&limit=20&offset=0',
      { headers }
    )
    const totalChannels = initialResponse.data?.data?.total || 0
    const channels = []

    for (let offset = 0; offset < totalChannels; offset += 20) {
      const response = await axios.get(
        `https://tm.tapi.videoready.tv/portal-search/pub/api/v1/channels/schedule?date=&languageFilters=&genreFilters=&limit=20&offset=${offset}`,
        { headers }
      )
      const pageChannels = response.data?.data?.channelList || []
      channels.push(...pageChannels)
    }

    return channels.map(channel => ({
      site_id: channel.id,
      name: channel.title,
      lang: 'en',
      icon: channel.transparentImageUrl || channel.thumbnailImage
    }))
  }
}
