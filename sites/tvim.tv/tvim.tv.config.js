const dayjs = require('dayjs')

module.exports = {
  site: 'tvim.tv',
  days: 2,
  url: function ({ date, channel }) {
    return `https://www.tvim.tv/script/program_epg?date=${date.format('DD.MM.YYYY')}&prog=${
      channel.site_id
    }&server_time=true`
  },
  parser: function ({ content }) {
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
  },
  async channels() {
    const axios = require('axios')
    const data = await axios
      .get('https://www.tvim.tv/script/epg/category_channels?category=all&filter=playable')
      .then(r => r.data)
      .catch(console.log)

    let channels = []
    data.data.forEach(item => {
      channels.push({
        lang: 'sq',
        site_id: item.epg_id,
        name: item.name
      })
    })

    return channels
  }
}

function parseStart(item) {
  return dayjs.unix(item.from_utc)
}

function parseStop(item) {
  return dayjs.unix(item.end_utc)
}

function parseItems(content) {
  const parsed = JSON.parse(content)

  return parsed.data.prog || []
}
