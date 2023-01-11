const dayjs = require('dayjs')

module.exports = {
  site: 'tv.cctv.com',
  days: 2,
  url({ channel, date }) {
    return `https://api.cntv.cn/epg/getEpgInfoByChannelNew?serviceId=tvcctv&c=${
      channel.site_id
    }&d=${date.format('YYYYMMDD')}`
  },
  parser({ content, channel }) {
    const programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const title = item.title
      const start = parseStart(item)
      const stop = parseStop(item)
      programs.push({
        title,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStop(item) {
  return dayjs.unix(item.endTime)
}

function parseStart(item) {
  return dayjs.unix(item.startTime)
}

function parseItems(content, channel) {
  const data = JSON.parse(content)

  return data.data[channel.site_id].list || []
}
