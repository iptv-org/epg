const cheerio = require('cheerio')
const axios = require('axios')
const { DateTime } = require('luxon')

module.exports = {
  site: 'awilime.com',
  days: 2,
  url({ channel, date }) {
    return `https://www.awilime.com/tv/napi_musor/${channel.site_id}/${date.format('YYYY_MM_DD')}`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)
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
        sub_title: parseSubTitle($item),
        description: parseDescription($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const html = await axios
      .get('https://www.awilime.com/tv/napi_musor')
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(html)
    const items = $('#body > div.tk > div > div').toArray()

    const channels = []
    items.forEach(item => {
      const name = $(item).find('a').text().trim()
      const url = $(item).find('a').attr('href')
      const [, site_id] = url.match(/\/tv\/napi_musor\/(.*)/) || [null, null]
      if (!site_id) return
      if (channels.find(channel => channel.site_id === site_id)) return

      channels.push({
        lang: 'hu',
        site_id,
        name
      })
    })

    return channels
  }
}

function parseTitle($item) {
  return $item('b > a').text().trim()
}

function parseSubTitle($item) {
  return $item('i').clone().children().remove('s').end().text().trim()
}

function parseDescription($item) {
  return $item('p').text().trim()
}

function parseStart($item, date) {
  let time = $item('b').clone().children().remove().end().text().trim()
  if (!time || !/^\d/.test(time)) return null
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return DateTime.fromFormat(time, 'yyyy-MM-dd HH:mm', { zone: 'Europe/Budapest' }).toUTC()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#body > div.tdc > div.td2 > div').toArray()
}
