const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'freetv.tv',
  days: 2,
  url: function ({ channel, date }) {
    const localDate = dayjs(date).tz('Asia/Jerusalem')
    const since = localDate.startOf('day').format('YYYY-MM-DDTHH:mmZZ')
    const till = localDate.add(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mmZZ')

    return `https://web.freetv.tv/api/products/lives/programmes?liveId[]=${
      channel.site_id
    }&since=${encodeURIComponent(since)}&till=${encodeURIComponent(till)}&lang=HEB&platform=BROWSER`
  },
  parser: function ({ content }) {
    const programs = []
    let items = []
    
    try {
      items = JSON.parse(content)
    } catch {
      return programs
    }

    items.forEach(item => {
      const start = parseStart(item)
      const stop = parseStop(item)
      if (!start.isValid() || !stop.isValid()) return

      programs.push({
        title: item.title,
        description: item.description || item.lead,
        image: getImageUrl(item),
        icon: getImageUrl(item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item) {
  return item.since ? dayjs.utc(item.since).tz('Asia/Jerusalem') : null
}

function parseStop(item) {
  return item.till ? dayjs.utc(item.till).tz('Asia/Jerusalem') : null
}

function getImageUrl(item) {
  const url = item.images?.['16x9']?.[0]?.url
  return url ? `https:${url}` : null
}
