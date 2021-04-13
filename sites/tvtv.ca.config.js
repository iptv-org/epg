const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  lang: 'en',
  site: 'tvtv.ca',
  channels: 'tvtv.ca.channels.xml',
  output: '.gh-pages/guides/tvtv.ca.guide.xml',
  url: function ({ date, channel }) {
    return `https://www.tvtv.ca/tvm/t/tv/v4/stations/${
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
      const icon = item.showPicture
        ? `https://cdn.tvpassport.com/image/show/480x720/${item.showPicture}`
        : null
      programs.push({
        title: item.showName,
        description: item.description,
        category: item.showType,
        start: start.toString(),
        stop: stop.toString(),
        icon
      })
    })

    return programs
  }
}
