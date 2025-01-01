const dayjs = require('dayjs')

module.exports = {
  site: 'telkussa.fi',
  days: 2,
  url: function ({ date, channel }) {
    return `https://telkussa.fi/API/Channel/${channel.site_id}/${date.format('YYYYMMDD')}`
  },
  parser: function ({ content }) {
    const programs = []
    const items = JSON.parse(content)
    if (!items.length) return programs

    items.forEach(item => {
      if (item.name && item.start && item.stop) {
        const start = dayjs.unix(parseInt(item.start) * 60)
        const stop = dayjs.unix(parseInt(item.stop) * 60)

        programs.push({
          title: item.name,
          description: item.description,
          start,
          stop
        })
      }
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const data = await axios
      .get('https://telkussa.fi/API/Channels')
      .then(r => r.data)
      .catch(console.log)

    return data.map(item => {
      return {
        lang: 'fi',
        site_id: item.id,
        name: item.name
      }
    })
  }
}
