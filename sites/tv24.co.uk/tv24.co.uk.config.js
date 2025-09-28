const dayjs = require('dayjs')
const axios = require('axios')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tv24.co.uk',
  days: 2,
  url: function ({ channel, date }) {
    return `https://tv24.co.uk/x/channel/${channel.site_id}/0/${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(30, 'm')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    let html = await axios
      .get('https://tv24.co.uk/x/settings/addremove', {
        headers: {
          Cookie: 'selectedPostcode=-; selectedProvider=1000193'
        }
      })
      .then(r => r.data)
      .catch(console.log)
    let $ = cheerio.load(html)

    let channels = []
    $('li')
      .toArray()
      .forEach(item => {
        const link = $(item).find('img').attr('src')
        if (!link || link.includes('ic_channel_default')) return
        const [, filename] = link.match(/channels\/(.*)\./)
        const site_id = filename.replace('-l', '')
        const name = $(item).find('h3').text().trim()

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
  return $item('h3').text()
}

function parseDescription($item) {
  return $item('p').text()
}

function parseStart($item, date) {
  const time = $item('.time').text()

  return dayjs.utc(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD h:mma')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('.program').toArray()
}
