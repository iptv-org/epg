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
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
      'content-type': 'application/json',
      locale: 'ENG'
    },
    data({ channel }) {
      return { id: channel.site_id }
    }
  },

  parser(context) {
    let data
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
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'content-type': 'application/json',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'fr-FR,fr;q=0.6',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      'priority': 'u=0, i',
      'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Brave";v="146"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'sec-gpc': '1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
    }

    const baseUrl = 'https://tm.tapi.videoready.tv/portal-search/pub/api/v1/channels'
    const initialUrl = `${baseUrl}?limit=1000&offset=0`
    const initialResponse = await axios.get(initialUrl, { headers: headers })
    const total = initialResponse.data?.data?.total || 0
    const channels = []

    for (let offset = 0; offset < total; offset += 1000) {
      const url = `${baseUrl}?limit=1000&offset=${offset}`
      const response = await axios.get(url, { headers: headers })
      const page = response.data?.data?.list || []
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
