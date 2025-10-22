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
  },
  async channels() {
    const axios = require('axios')
    const html = await axios
      .get('https://www.tivu.tv/epg_ajax_sat.aspx?d=0')
      .then(r => r.data)
      .catch(console.log)

    let channels = []

    const $ = cheerio.load(html)
    $('.q').each((i, el) => {
      const site_id = $(el).attr('id')
      const name = $(el).find('a').first().data('channel')

      if (!name) return

      channels.push({
        lang: 'it',
        site_id,
        name
      })
    })

    return channels
  }
}

function parseTitle($item) {
  const [title] = $item('a').html().split('<br>')

  return title
}

function parseStart($item, date) {
  const [, , time] = $item('a').html().split('<br>')
  if (!time) return null

  return DateTime.fromFormat(`${date.format('YYYY-MM-DD')} ${time}`, 'yyyy-MM-dd HH:mm', {
    zone: 'Europe/Rome'
  }).toUTC()
}

function parseItems(content, channel) {
  if (!content) return []
  const $ = cheerio.load(content)

  return $(`.q[id="${channel.site_id}"] > .p`).toArray()
}
