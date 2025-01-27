const dayjs = require('dayjs')

module.exports = {
  site: 'tvtv.us',
  days: 2,
  url({ date, channel }) {
    return `https://www.tvtv.us/api/v1/lineup/USA-NY71652-X/grid/${date.toJSON()}/${date
      .add(1, 'day')
      .toJSON()}/${channel.site_id}`
  },
  parser({ content }) {
    let programs = []

    const items = parseItems(content)
    items.forEach(item => {
      const start = dayjs(item.startTime)
      const stop = start.add(item.duration, 'minute')

      programs.push({
        title: item.title,
        subtitle: item.subtitle || null,
        start,
        stop
      })
    })

    return programs
  }
}

function parseItems(content) {
  try {
    const json = JSON.parse(content)
    if (!json.length) return []

    return json[0]
  } catch {
    return []
  }
}
