const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  lang: 'en',
  site: 'tvguide.com',
  channels: 'tvguide.com.channels.xml',
  output: '.gh-pages/guides/tvguide.com.guide.xml',
  url: function ({ date, channel }) {
    const localTime = date.tz('America/New_York')
    const parts = channel.site_id.split('#')
    const start = localTime.startOf('d')
    const duration = localTime.endOf('d').diff(start, 'm')
    const url = `https://cmg-prod.apigee.net/v1/xapi/tvschedules/tvguide/${
      parts[0]
    }/web?start=${start.unix()}&duration=${duration}&channelSourceIds=${parts[1]}`

    return url
  },
  parser: function ({ content }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        start: parseTime(item.startTime),
        stop: parseTime(item.endTime)
      })
    })

    return programs
  }
}

function parseTime(timestamp) {
  return dayjs.unix(timestamp)
}

function parseItems(content) {
  const json = JSON.parse(content)

  return json.data.items[0].programSchedules
}
