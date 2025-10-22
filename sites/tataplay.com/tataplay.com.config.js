const axios = require('axios')

module.exports = {
  site: 'tataplay.com',
  days: 1,

  url({ date }) {
    return `https://tm.tapi.videoready.tv/content-detail/pub/api/v2/channels/schedule?date=${date.format(
      'DD-MM-YYYY'
    )}`
  },

  request: {
    method: 'POST',
    headers: {
      Accept: '*/*',
      Origin: 'https://watch.tataplay.com',
      Referer: 'https://watch.tataplay.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'content-type': 'application/json',
      locale: 'ENG',
      platform: 'web'
    },
    data({ channel }) {
      return { id: channel.site_id }
    }
  },

  parser(context) {
    let data = []
    try {
      const json = JSON.parse(context.content)
      const programs = json?.data?.epg || []

      data = programs.map(program => ({
        title: program.title,
        start: program.startTime,
        stop: program.endTime,
        description: program.desc,
        category: program.category,
        icon: program.boxCoverImage
      }))
    } catch {
      data = []
    }
    return data
  },

  async channels() {
    const headers = {
      Accept: '*/*',
      Origin: 'https://watch.tataplay.com',
      Referer: 'https://watch.tataplay.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'content-type': 'application/json',
      locale: 'ENG',
      platform: 'web'
    }

    const baseUrl = 'https://tm.tapi.videoready.tv/portal-search/pub/api/v1/channels/schedule'
    const initialUrl = `${baseUrl}?date=&languageFilters=&genreFilters=&limit=20&offset=0`
    const initialResponse = await axios.get(initialUrl, { headers })
    const total = initialResponse.data?.data?.total || 0
    const channels = []

    for (let offset = 0; offset < total; offset += 20) {
      const url = `${baseUrl}?date=&languageFilters=&genreFilters=&limit=20&offset=${offset}`
      const response = await axios.get(url, { headers })
      const page = response.data?.data?.channelList || []
      channels.push(...page)
    }

    return channels.map(channel => ({
      site_id: channel.id,
      name: channel.title,
      lang: 'en',
      icon: channel.transparentImageUrl || channel.thumbnailImage
    }))
  }
}
