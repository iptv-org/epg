const dayjs = require('dayjs')
const isBetween = require('dayjs/plugin/isBetween')

dayjs.extend(isBetween)

module.exports = {
  site: 'pbsguam.org',
  days: 2, // the program is only available Thursday through Sunday
  url: 'https://pbsguam.org/calendar/',
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      programs.push({
        title: item.title,
        start: dayjs(item.start),
        stop: dayjs(item.end)
      })
    })

    return programs
  }
}

function parseItems(content, date) {
  const [_, json] = content.match(/EventsSchedule_1 = (.*);/i) || [null, null]
  if (!json) return []
  const data = JSON.parse(json)
  if (!data || !Array.isArray(data.feed)) return []

  return data.feed.filter(
    i =>
      dayjs(i.start).isBetween(date, date.add(1, 'd')) ||
      dayjs(i.end).isBetween(date, date.add(1, 'd'))
  )
}
