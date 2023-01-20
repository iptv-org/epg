const dayjs = require('dayjs')

module.exports = {
  site: 'sky.de',
  days: 2,
  url: `https://www.sky.de/sgtvg/service/getBroadcastsForGrid`,
  request: {
    method: 'POST',
    headers: {
        'accept-language': 'en-GB',
        'accept-encoding': 'gzip, deflate, br',
        accept: 'application/json'
      },
    data: function ({ channel, date }) {
      return {
        cil: [channel.site_id],
        d: date.valueOf()
      }
    }
  },
  parser: function ({ content, channel }) {
    const programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.et,
        description: item.epit,
        category: item.ec,
        start: dayjs(item.bsdt),
        stop: dayjs(item.bedt),
        season: item.sn,
        episode: item.en,
        icon: item.pu ? `http://sky.de${item.pu}` : null
      })
    })

    return programs
  }
}

function parseContent(content, channel) {
  const json = JSON.parse(content)
  if (!Array.isArray(json.cl)) return null
  return json.cl.find(i => i.ci == channel.site_id)
}

function parseItems(content, channel) {
  const data = parseContent(content, channel)
  return data && Array.isArray(data.el) ? data.el : []
}