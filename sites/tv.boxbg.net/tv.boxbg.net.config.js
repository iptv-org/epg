const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tv.boxbg.net',
  url({ channel, date }) {
    return `https://tv.boxbg.net/channel/${channel.site_id}?day=${date.format('DDMMYYYY')}`
  },
  parser({ content }) {
    let programs = []
    const items = parseItems(content)

    items.forEach(item => {
      programs.push({
        title: parseTitle(item),
        categories: parseCategories(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const content = await axios
      .get('https://tv.boxbg.net/')
      .then(r => r.data)
      .catch(console.error)
    const $ = cheerio.load(content)

    let channels = []
    $('channel-cell').each((i, el) => {
      const data = $(el).attr(':channel')
      const channel = JSON.parse(data)

      channels.push({
        site_id: [channel.name, channel.id].join('/'),
        name: channel.name,
        lang: 'bg'
      })
    })

    return channels
  }
}

function parseTitle(item) {
  return item.text
}

function parseCategories(item) {
  return item.categories ? item.categories.split(',') : []
}

function parseStart(item) {
  return dayjs.tz(item.start_at, 'YYYY-MM-DD HH:mm', 'Europe/Sofia')
}

function parseStop(item) {
  return dayjs.tz(item.end_at, 'YYYY-MM-DD HH:mm', 'Europe/Sofia')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  let items = []
  $('.list-events > a').each((i, el) => {
    const onclick = $(el).attr('@click.prevent')
    const [, eventLink] = onclick.match(/eventLink\(\$event,(.*)\)/) || [null, null]

    if (eventLink) {
      const data = JSON.parse(eventLink)
      items.push(data)
    }
  })

  return items
}
