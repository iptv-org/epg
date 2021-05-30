const dayjs = require('dayjs')

module.exports = {
  lang: 'lv',
  site: 'tv.lv',
  channels: 'tv.lv.channels.xml',
  output: '.gh-pages/guides/tv.lv.guide.xml',
  url: function ({ date, channel }) {
    return `https://www.tv.lv/programme/listing/none/${date.format(
      'DD-MM-YYYY'
    )}?filter=channel&subslug=${channel.site_id}`
  },
  logo: function ({ content }) {
    const data = JSON.parse(content)
    const logo = data.schedule.programme.length ? data.schedule.programme[0].channel.logo_64 : null

    return logo ? `https://cdn.tvstart.com/img/channel/${logo}` : null
  },
  parser: function ({ content }) {
    const programs = []
    const data = JSON.parse(content)
    const items = data.schedule.programme
    if (!items.length) return programs

    items.forEach(item => {
      if (item.title && item.start_unix && item.stop_unix) {
        const start = dayjs.unix(item.start_unix)
        const stop = dayjs.unix(item.stop_unix)
        programs.push({
          title: item.title,
          description: item.description_long,
          category: item.categorystring,
          icon: item.image,
          start: start.toString(),
          stop: stop.toString()
        })
      }
    })

    return programs
  }
}
