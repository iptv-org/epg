const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'tva.tv',
  days: 2,
  url: function ({ date, channel }) {
    return `https://api.ott.tva.tv/v2/epg/program_events.json?channel_id=${
      channel.site_id
    }&pivot_date=${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ content }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.name,
        description: item.description,
        start: dayjs(item.start_at),
        stop: dayjs(item.end_at)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(
        'https://api.ott.tva.tv/v1/channels?client_id=66797942-ff54-46cb-a109-3bae7c855370&client_version=0.0.1&expand%5Bchannel%5D=images&locale=en-GB&page%5Blimit%5D=100&page%5Boffset%5D=0&timezone=10800',
        {
          headers: {
            Origin: 'https://tva.tv'
          }
        }
      )
      .then(r => r.data)
      .catch(console.log)

    const channels = []
    for (let item of data.data) {
      channels.push({
        lang: 'fa',
        site_id: item.id,
        name: item.name,
        xmltv_id: item.slug
      })
    }

    return channels
  }
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.data)) return []

  return data.data
}
