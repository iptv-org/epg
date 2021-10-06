const dayjs = require('dayjs')

module.exports = {
  site: 'tv.lv',
  lang: 'lv',
  url: function ({ date, channel }) {
    return `https://www.tv.lv/programme/listing/none/${date.format(
      'DD-MM-YYYY'
    )}?filter=channel&subslug=${channel.site_id}`
  },
  logo: function ({ content }) {
    const data = JSON.parse(content)
    const logo =
      data.schedule.programme && data.schedule.programme.length
        ? data.schedule.programme[0].channel.logo_64
        : null

    return logo ? `https://cdn.tvstart.com/img/channel/${logo}` : null
  },
  parser: function ({ content }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = parseStop(item)
      programs.push({
        title: item.title,
        description: item.description_long,
        category: item.categorystring,
        icon: item.image,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item) {
  return item.start_unix ? dayjs.unix(item.start_unix) : null
}

function parseStop(item) {
  return item.stop_unix ? dayjs.unix(item.stop_unix) : null
}

function parseItems(content) {
  const data = JSON.parse(content)

  return data.schedule.programme || []
}
