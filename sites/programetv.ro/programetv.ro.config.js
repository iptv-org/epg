const dayjs = require('dayjs')

module.exports = {
  request: {
    timeout: 30000
  },
  site: 'programetv.ro',
  url: function ({ date, channel }) {
    const daysOfWeek = {
      0: 'duminica',
      1: 'luni',
      2: 'marti',
      3: 'ieri',
      4: 'azi',
      5: 'vineri',
      6: 'sambata'
    }
    const day = date.day()

    return `https://www.programetv.ro/post/${channel.site_id}/${daysOfWeek[day]}/`
  },
  logo({ content }) {
    const data = parseContent(content)

    return data ? data.station.icon : null
  },
  parser: function ({ content }) {
    let programs = []
    const data = parseContent(content)
    if (!data || !data.shows) return programs
    const items = data.shows
    items.forEach(item => {
      let title = item.title
      if (item.season) title += ` Sez.${item.season}`
      if (item.episode) title += ` Ep.${item.episode}`
      programs.push({
        title,
        description: item.desc,
        category: item.categories,
        start: parseStart(item).toString(),
        stop: parseStop(item).toString(),
        icon: item.icon
      })
    })

    return programs
  }
}

function parseStart(item) {
  return dayjs(item.start).utc()
}

function parseStop(item) {
  return dayjs(item.stop).utc()
}

function parseContent(content) {
  const [_, data] = content.match(/var pageData = ((.|[\r\n])+);\n/) || [null, null]

  return data ? JSON.parse(data) : {}
}
