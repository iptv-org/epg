const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'astro.com.my',
  request: {
    timeout: 15000
  },
  url: function ({ date, channel }) {
    return `http://ams-api.astro.com.my/ams/v3/getEvents?periodStart=${date.format(
      'YYYY-MM-DD'
    )}:00:00:00&periodEnd=${date.format('YYYY-MM-DD')}:23:59:59&channelId=${channel.site_id}`
  },
  logo: function ({ channel }) {
    return `https://divign0fdw3sv.cloudfront.net/Images/ChannelLogo/contenthub/${channel.site_id}_144.png`
  },
  parser: function ({ content }) {
    const programs = []
    const data = JSON.parse(content)
    const items = data.getevent
    if (!items.length) return programs

    items.forEach(item => {
      if (item.programmeTitle && item.displayDateTimeUtc && item.displayDuration) {
        const start = dayjs.utc(item.displayDateTimeUtc)
        const duration = parseDuration(item.displayDuration)
        const stop = start.add(duration, 's')
        programs.push({
          title: item.programmeTitle,
          description: item.shortSynopsis,
          category: item.subGenre,
          icon: item.epgEventImage,
          start: start.toString(),
          stop: stop.toString()
        })
      }
    })

    return programs
  }
}

function parseDuration(duration) {
  const match = duration.match(/(\d{2}):(\d{2}):(\d{2})/)
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const seconds = parseInt(match[3])

  return hours * 3600 + minutes * 60 + seconds
}
