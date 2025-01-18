const cheerio = require('cheerio')
const axios = require('axios')
const { DateTime } = require('luxon')

module.exports = {
  site: 'tvinsider.com',
  days: 2,
  url({ channel }) {
    return `https://www.tvinsider.com/network/${channel.site_id}/schedule/`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (!start) return
      if (prev) {
        prev.stop = start
      }
      const stop = start.plus({ minute: 30 })

      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        category: parseCategory($item),
        date: parseDate($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const html = await axios
      .get('https://www.tvinsider.com/network/5-star-max/')
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(html)
    const items = $('body > main > section > select > option').toArray()

    const channels = []
    items.forEach(item => {
      const name = $(item).text().trim()
      const path = $(item).attr('value')
      if (!path) return
      const [, , site_id] = path.split('/') || [null, null, null]
      if (!site_id) return

      channels.push({
        lang: 'en',
        site_id,
        name
      })
    })

    return channels
  }
}

function parseTitle($item) {
  return $item('h3').text().trim()
}

function parseDescription($item) {
  return $item('p').text().trim()
}

function parseCategory($item) {
  const [category] = $item('h4').text().trim().split(' • ')

  return category
}

function parseDate($item) {
  const [, date] = $item('h4').text().trim().split(' • ')

  return date
}

function parseStart($item, date) {
  let time = $item('time').text().trim()
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return DateTime.fromFormat(time, 'yyyy-MM-dd t', { zone: 'America/New_York' }).toUTC()
}

function parseItems(content, date) {
  const $ = cheerio.load(content)

  return $(`#${date.format('MM-DD-YYYY')}`)
    .next()
    .find('a')
    .toArray()
}
