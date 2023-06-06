const dayjs = require('dayjs')
const cheerio = require('cheerio')
const { DateTime } = require('luxon')

module.exports = {
  site: 'tivu.tv',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ date }) {
    const diff = date.diff(DateTime.now().toUTC().startOf('day'), 'd')

    return `https://www.tivu.tv/epg_ajax_sat.aspx?d=${diff}`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      if (!start) return
      if (prev) {
        if (start < prev.start) {
          start = start.plus({ days: 1 })
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.plus({ minutes: 30 })
      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseTitle($item) {
  const [title, _, __] = $item('a').html().split('<br>')

  return title
}

function parseStart($item, date) {
  const [_, __, time] = $item('a').html().split('<br>')
  if (!time) return null

  return DateTime.fromFormat(`${date.format('YYYY-MM-DD')} ${time}`, 'yyyy-MM-dd HH:mm', {
    zone: 'Europe/Rome'
  }).toUTC()
}

function parseItems(content, channel, date) {
  if (!content) return []
  const $ = cheerio.load(content)

  return $(`.q[id="${channel.site_id}"] > .p`).toArray()
}
