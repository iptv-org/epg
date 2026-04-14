const dayjs = require('dayjs')

module.exports = {
  site: 'tv.lv',
  days: 2,
  url: function ({ date, channel }) {
    return `https://www.tv.lv/programme/listing/none/${date.format(
      'DD-MM-YYYY'
    )}?filter=channel&subslug=${channel.site_id}`
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
        image: item.image,
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const groups = await axios
      .get('https://www.tv.lv/data/channels/lvall')
      .then(r => r.data)
      .catch(console.log)

    let channels = []

    groups.forEach(group => {
      group.channels.forEach(item => {
        channels.push({
          lang: 'lv',
          site_id: item.slug,
          name: item.name
        })
      })
    })

    return channels
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
