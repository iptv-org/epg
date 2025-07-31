const dayjs = require('dayjs')

module.exports = {
  site: 'frikanalen.no',
  days: 2,
  url({ date }) {
    return `https://frikanalen.no/api/scheduleitems/?date=${date.format(
      'YYYY-MM-DD'
    )}&format=json&limit=100`
  },
  parser({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: parseTitle(item),
        category: parseCategory(item),
        description: parseDescription(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  }
}

function parseTitle(item) {
  return item.video.name
}

function parseCategory(item) {
  return item.video.categories
}

function parseDescription(item) {
  return item.video.header
}

function parseStart(item) {
  return dayjs(item.starttime)
}

function parseStop(item) {
  return dayjs(item.endtime)
}

function parseItems(content) {
  const data = JSON.parse(content)

  return data && Array.isArray(data.results) ? data.results : []
}
