const { DateTime } = require('luxon')
const axios = require('axios')

module.exports = {
  site: 'zap.co.ao',
  days: 2,
  maxConnections: 200,
  url: function ({ date, channel }) {
    return `https://zapon.zapsi.net/ao/m/api/epg/events?date=${date.format('YYYYMMDD')}&channel=${
      channel.site_id
    }`
  },
  parser: function ({ content }) {
    const programs = []
    const items = parseItems(content)
    if (!items.length) return programs
    items.forEach(item => {
      programs.push({
        title: item.programName,
        description: item.programDescription,
        category: item.categoryName,
        start: DateTime.fromSeconds(item.utcBeginDate).toUTC(),
        stop: DateTime.fromSeconds(item.utcEndDate).toUTC()
      })
    })

    return programs
  },
  async channels() {
    const channels = await axios
      .get(`https://zapon.zapsi.net/ao/m/api/epg/channels`)
      .then(r => r.data.data)
      .catch(console.log)

    return channels.map(item => {
      return {
        lang: 'pt',
        site_id: item.id,
        name: item.name
      }
    })
  }
}

function parseItems(content) {
  const data = JSON.parse(content)

  return data.data || []
}
