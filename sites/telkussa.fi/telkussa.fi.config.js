const dayjs = require('dayjs')

module.exports = {
  site: 'telkussa.fi',
  url: function ({ date, channel }) {
    return `https://telkussa.fi/API/Channel/${channel.site_id}/${date.format('YYYYMMDD')}`
  },
  logo: function ({ channel }) {
    return `https://telkussa.fi/images/chan${channel.site_id}@3x.png`
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
