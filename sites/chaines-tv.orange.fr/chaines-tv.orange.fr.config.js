const dayjs = require('dayjs')

module.exports = {
  site: 'chaines-tv.orange.fr',
  days: 2,
  url({ channel, date }) {
    return `https://rp-ott-mediation-tv.woopic.com/api-gw/live/v3/applications/STB4PC/programs?groupBy=channel&includeEmptyChannels=false&period=${date.valueOf()},${date
      .add(1, 'd')
      .valueOf()}&after=${channel.site_id}&limit=1`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = parseStop(item, start)
      programs.push({
        title: item.title,
        category: item.genreDetailed,
        description: item.synopsis,
        icon: parseIcon(item),
        start: start.toJSON(),
        stop: stop.toJSON()
      })
    })

    return programs
  }
}

function parseIcon(item) {
  return item.covers && item.covers.length ? item.covers[0].url : null
}

function parseStart(item) {
  return dayjs.unix(item.diffusionDate)
}

function parseStop(item, start) {
  return start.add(item.duration, 's')
}

function parseItems(content, channel) {
  const data = JSON.parse(content)

  return data && data[channel.site_id] ? data[channel.site_id] : []
}
