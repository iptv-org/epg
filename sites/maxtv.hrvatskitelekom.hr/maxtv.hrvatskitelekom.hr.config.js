const dayjs = require('dayjs')

module.exports = {
  site: 'maxtv.hrvatskitelekom.hr',
  days: 2,
  url: 'https://player.maxtvtogo.tportal.hr:8082/OTT4Proxy/proxy/epg/shows',
  request: {
    method: 'POST',
    data: function ({ channel, date }) {
      return {
        channelList: [channel.site_id],
        startDate: date.unix(),
        endDate: date.add(1, 'd').unix()
      }
    }
  },
  parser: function ({ content, channel }) {
    const programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      if (item.showId == -1) return
      programs.push({
        title: item.title,
        category: item.category,
        start: dayjs.unix(item.startTime),
        stop: dayjs.unix(item.endTime)
      })
    })

    return programs
  }
}

function parseContent(content, channel) {
  const json = JSON.parse(content)
  if (!Array.isArray(json.data)) return null

  return json.data.find(i => i.channelId == channel.site_id)
}

function parseItems(content, channel) {
  const data = parseContent(content, channel)

  return data && Array.isArray(data.shows) ? data.shows : []
}
