const dayjs = require('dayjs')

module.exports = {
  site: 'www3.nhk.or.jp',
  days: 5,
  lang: 'en',
  delay: 5000,

  url: function ({ date }) {
    return `https://masterpl.hls.nhkworld.jp/epg/w/${date
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '')}.json`
  },

  request: {
    method: 'GET',
    timeout: 5000,
    cache: { ttl: 60 * 1000 },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    }
  },

  logo: function (context) {
    return context.channel.logo
  },

  async parser(context) {
    const programs = []
    const items = parseItems(context.content)

    for (let item of items) {
      programs.push({
        title: item.title,
        sub_title: item.episodeTitle,
        start: dayjs(item.startTime, 'YYYY-MM-DDTHH:mm:ssZ'),
        stop: dayjs(item.endTime, 'YYYY-MM-DDTHH:mm:ssZ'),
        description: item.description,
        image: item.episodeThumbnailURL ? item.episodeThumbnailURL : item.thumbnail
      })
    }

    return programs
  }
}

function parseItems(content) {
  if (content != '') {
    const data = JSON.parse(content)
    return !data || !data.data || !Array.isArray(data.data) ? [] : data.data
  } else {
    return []
  }
}
