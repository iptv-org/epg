const dayjs = require('dayjs')

module.exports = {
  lang: 'hr',
  site: 'maxtv.hrvatskitelekom.hr',
  channels: 'maxtv.hrvatskitelekom.hr.channels.xml',
  output: '.gh-pages/guides/maxtv.hrvatskitelekom.hr.guide.xml',
  request: {
    method: 'POST',
    data: function ({ channel, date }) {
      return {
        channelList: [channel.site_id],
        startDate: date.startOf('d').unix(),
        endDate: date.endOf('d').unix()
      }
    }
  },
  url: function ({ date, channel }) {
    return `https://player.maxtvtogo.tportal.hr:8082/OTT4Proxy/proxy/epg/shows`
  },
  logo: function ({ content }) {
    const json = JSON.parse(content)
    return json.data ? json.data[0].logo : null
  },
  parser: function ({ content }) {
    const programs = []
    const json = JSON.parse(content)
    if (!json.data) return programs

    const items = json.data[0].shows
    items.forEach(item => {
      if (item.title && item.startTime && item.endTime) {
        const start = dayjs.unix(item.startTime)
        const stop = dayjs.unix(item.endTime)
        programs.push({
          title: item.title,
          category: item.category,
          start: start.toString(),
          stop: stop.toString()
        })
      }
    })

    return programs
  }
}
