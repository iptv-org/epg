const dayjs = require('dayjs')

module.exports = {
  site: 'mbc.net',
  days: 2,
  skip: true, // NOTE: there is no program on the site
  url({ date, channel }) {
    return `https://www.mbc.net/.rest/api/channel/grids?from=${date.valueOf()}&to=${date
      .add(1, 'd')
      .valueOf()}&channel=${channel.site_id}`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.showPageTitle,
        category: item.showPageGenreInArabic,
        description: item.showPageAboutInArabic,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  }
}

function parseStart(item) {
  return dayjs(item.startTime).toJSON()
}

function parseStop(item) {
  return dayjs(item.endTime).toJSON()
}

function parseItems(content) {
  const data = JSON.parse(content)

  return data
}
