const dayjs = require('dayjs')

module.exports = {
  site: 'telkussa.fi',
  days: 2,
  url: function ({ date, channel }) {
    return `https://telkussa.fi/API/Channel/${channel.site_id}/${date.format('YYYYMMDD')}`
  },
  parser: function ({ content, date, channel }) {
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
          start: start.toString(),
          stop: stop.toString()
        })
      }
    })

    return programs
  }
}
