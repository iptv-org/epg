const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  request: {
    timeout: 15000
  },
  site: 'tvtv.us',
  url: function ({ date, channel }) {
    return `https://tvtv.us/tvm/t/tv/v4/stations/${
      channel.site_id
    }/listings?start=${date.format()}&end=${date.add(1, 'd').format()}`
  },
  logo({ channel }) {
    return channel.logo
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
      let title = item.showName
      if (title === 'Movie') {
        title = item.episodeTitle
      }
      programs.push({
        title: title,
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
