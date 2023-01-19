const dayjs = require('dayjs')

module.exports = {
  site: 'flixed.io',
  days: 1, // NOTE: changing the date in a request does not change the response
  url: function ({ date, channel }) {
    return `https://tv-guide.vercel.app/api/stationAirings?stationId=${
      channel.site_id
    }&startDateTime=${date.toJSON()}`
  },
  parser({ content }) {
    let programs = []
    let items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.program.title,
        description: item.program.longDescription,
        category: item.program.subType,
        icon: parseIcon(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  }
}

function parseIcon(item) {
  const uri = item.program.preferredImage.uri

  return uri ? `https://adma.tmsimg.com/assets/${uri}` : null
}

function parseStart(item) {
  return dayjs(item.startTime)
}

function parseStop(item) {
  return dayjs(item.endTime)
}

function parseItems(content, channel) {
  return JSON.parse(content)
}
