const dayjs = require('dayjs')

module.exports = {
  site: 'sky.com',
  days: 2,
  url: function ({ date, channel }) {
    return `https://epgservices.sky.com/5.2.2/api/2.0/channel/json/${
      channel.site_id
    }/${date.unix()}/86400/4`
  },
  parser: function ({ content, date, channel }) {
    const programs = []
    const items = parseItems(content, channel)

    items.forEach(item => {
      programs.push({
        title: item.t,
        description: item.d,
        start: dayjs.unix(item.s),
        stop: dayjs.unix(item.s + item.m[1]),
        icon: item.img ? `http://epgstatic.sky.com/epgdata/1.0/paimage/46/1/${item.img}` : null
      })
    })

    return programs
  }
}

function parseItems(content, channel) {
  const data = JSON.parse(content)

  return data && data.listings ? data.listings[channel.site_id] : []
}
