const cheerio = require('cheerio')
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')
const sortBy = require('lodash.sortby')
const uniqBy = require('lodash.uniqby')

dayjs.extend(customParseFormat)
dayjs.extend(timezone)

module.exports = {
  site: 'streamingtvguides.com',
  days: 2,
  url({ channel }) {
    return `https://streamingtvguides.com/Channel/${channel.site_id}`
  },
  parser({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const start = parseStart($item)
      if (!date.isSame(start, 'd')) return

      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        start,
        stop: parseStop($item)
      })
    })

    programs = sortBy(uniqBy(programs, p => p.start), p => p.start.valueOf())

    return programs
  },
  async channels() {
    const axios = require('axios')
    const data = await axios
      .get('https://streamingtvguides.com/Preferences')
      .then(r => r.data)
      .catch(console.log)

    let channels = []

    const $ = cheerio.load(data)
    $('#channel-group-all > div > div').each((i, el) => {
      const site_id = $(el).find('input').attr('value').replace('&', '&amp;')
      const label = $(el).text().trim()
      const svgTitle = $(el).find('svg').attr('alt')
      const name = (label || svgTitle || '').replace(site_id, '').trim()

      if (!name || !site_id) return

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
  return $item('.card-body > .prog-contains > .card-title')
    .clone()
    .children()
    .remove()
    .end()
    .text()
    .trim()
}

function parseDescription($item) {
  return $item('.card-body > .card-text').clone().children().remove().end().text().trim()
}

function parseStart($item) {
  const date = $item('.card-body').clone().children().remove().end().text().trim()
  const [time] = date.split(' - ')

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm:ss [PST]', 'PST').utc()
}

function parseStop($item) {
  const date = $item('.card-body').clone().children().remove().end().text().trim()
  const [, time] = date.split(' - ')

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm:ss [PST]', 'PST').utc()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('.container').toArray()
}
