const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  request: {
    timeout: 15000
  },
  site: 'directv.com',
  url({ channel, date }) {
    return `https://www.directv.com/json/channelschedule?channels=${
      channel.site_id
    }&startTime=${date.format()}&hours=24`
  },
  logo({ channel }) {
    return channel.logo
  },
  parser({ content }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      if (item.programID === '-1') return
      const start = parseStart(item)
      const stop = start.add(item.duration, 'm')
      programs.push({
        title: item.title,
        description: item.description,
        category: item.subcategoryList,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item) {
  return dayjs.utc(item.airTime)
}

function parseItems(content) {
  const data = JSON.parse(content)

  return data && data.schedule && data.schedule[0] ? data.schedule[0].schedules : []
}
