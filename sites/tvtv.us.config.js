const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  lang: 'en',
  site: 'tvtv.us',
  channels: 'tvtv.us.channels.xml',
  output: '.gh-pages/guides/tvtv.us.guide.xml',
  url: function ({ date, channel }) {
    return `https://www.tvtv.us/tvm/t/tv/v4/stations/${
      channel.site_id
    }/listings?start=${date.format()}&end=${date.add(1, 'd').format()}`
  },
  parser: function ({ content }) {
    let programs = []
    const items = JSON.parse(content)
    if (!items.length) return programs
    items.forEach(item => {
      const start = dayjs.utc(item.listDateTime)
      const stop = start.add(item.duration, 'm')
      programs.push({
        title: item.showName,
        description: item.description,
        category: item.showType,
        start: start.toString(),
        stop: stop.toString()
      })
    })

    return programs
  }
}
