const axios = require('axios')
const cheerio = require('cheerio')
const { DateTime } = require('luxon')

module.exports = {
  site: 'entertainment.ie',
  days: 2,
  url: function ({ date, channel }) {
    return `https://entertainment.ie/tv/${channel.site_id}/?date=${date.format(
      'DD-MM-YYYY'
    )}&time=all-day`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (!start) return
      if (prev && start < prev.start) {
        start = start.plus({ days: 1 })
      }
      const duration = parseDuration($item)
      const stop = start.plus({ minutes: duration })
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        categories: parseCategories($item),
        icon: parseIcon($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(`https://entertainment.ie/tv/all-channels/`)
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(data)
    let channels = $('.tv-filter-container > tv-filter').attr(':channels')
    channels = JSON.parse(channels)

    return channels.map(c => {
      return {
        site_id: c.slug,
        name: c.name
      }
    })
  }
}

function parseIcon($item) {
  return $item('.text-holder > .btn-hold > .btn-wrap > a.btn-share').data('img')
}

function parseTitle($item) {
  return $item('.text-holder h3').text().trim()
}

function parseDescription($item) {
  return $item('.text-holder > .btn-hold > .btn-wrap > a.btn-share').data('description')
}

function parseCategories($item) {
  const genres = $item('.text-holder > .btn-hold > .btn-wrap > a.btn-share').data('genres')

  return genres ? genres.split(', ') : []
}

function parseStart($item, date) {
  let d = $item('.text-holder > .btn-hold > .btn-wrap > a.btn-share').data('time')
  let [_, time] = d ? d.split(', ') : [null, null]

  return time
    ? DateTime.fromFormat(`${date.format('YYYY-MM-DD')} ${time}`, 'yyyy-MM-dd HH:mm', {
        zone: 'UTC'
      }).toUTC()
    : null
}

function parseDuration($item) {
  const duration = $item('.text-holder > .btn-hold > .btn-wrap > a.btn-share').data('duration')

  return parseInt(duration)
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $(`.info-list > li`).toArray()
}
