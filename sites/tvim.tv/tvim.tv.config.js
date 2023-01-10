const dayjs = require('dayjs')

module.exports = {
  site: 'tvim.tv',
  days: 2,
  url: function ({ date, channel }) {
    return `https://www.tvim.tv/script/program_epg?date=${date.format('DD.MM.YYYY')}&prog=${
      channel.site_id
    }&server_time=true`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = parseStop(item)

      programs.push({
        title: item.title,
        description: item.desc,
        category: item.genre,
        start: start.toString(),
        stop: stop.toString()
      })
    })

    return programs
  }
}

function parseStart(item) {
  return dayjs.unix(item.from_utc)
}

function parseStop(item) {
  return dayjs.unix(item.end_utc)
}

function parseItems(content, channel) {
  const parsed = JSON.parse(content)

  return parsed.data.prog || []
}
