const dayjs = require('dayjs')

module.exports = {
  site: 'www.tv-tokyo.co.jp',
  days: 2,
  delay: 5000,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    }
  },
  url({ date }) {
    return `https://www.tv-tokyo.co.jp/tbcms/assets/data/${date.format('YYYYMMDD')}.json`
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.description,
        image: parseImage(item),
        start: dayjs(item.sts),
        stop: dayjs(item.ets)
      })
    })

    return programs
  },
  channels() {
    return [
      {
        name: 'BSテレ東',
        site_id: 'bs-tv-tokyo',
        lang: 'ja',
        xmltv_id: 'BSTVTokyo.jp'
      },
      {
        name: 'BSテレ東 4K',
        site_id: 'bs-tv-tokyo-4k',
        lang: 'ja',
        xmltv_id: 'BSTVTokyo4K.jp'
      }
    ]
  }
}

function parseImage(item) {
  return item.image?.file_path ? `https://www.tv-tokyo.co.jp${item.image.file_path}` : null
}

function parseItems(content, channel) {
  try {
    const data = JSON.parse(content)
    if (!data) return []
    const events = Object.values(data).flatMap(group => Object.values(group))
    if (!Array.isArray(events)) return []

    return events.filter(i => i.channel === channel.site_id)
  } catch {
    return []
  }
}
