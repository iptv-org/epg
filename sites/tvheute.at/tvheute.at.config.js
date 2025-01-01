const cheerio = require('cheerio')
const dayjs = require('dayjs')

module.exports = {
  site: 'tvheute.at',
  days: 2,
  url({ channel, date }) {
    return `https://tvheute.at/part/channel-shows/partial/${channel.site_id}/${date.format(
      'DD-MM-YYYY'
    )}`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: parseTitle(item),
        description: parseDescription(item),
        image: parseImage(item),
        category: parseCategory(item),
        start: parseStart(item).toJSON(),
        stop: parseStop(item).toJSON()
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const html = await axios
      .get('https://tvheute.at/part/channel-selection')
      .then(r => r.data)
      .catch(console.log)

    let channels = []

    const $ = cheerio.load(html)
    $('.sortable-list > li').each((i, el) => {
      const name = $(el).find('label').text()
      const site_id = $(el).find('input').attr('value')

      channels.push({
        lang: 'de',
        site_id,
        name
      })
    })

    return channels
  }
}

function parseTitle(item) {
  const $ = cheerio.load(item)

  return $('.title-col strong').text()
}

function parseDescription(item) {
  const $ = cheerio.load(item)

  return $('.title-col .description').text()
}

function parseCategory(item) {
  const $ = cheerio.load(item)

  return $('.station-col > .type').text()
}

function parseImage(item) {
  const $ = cheerio.load(item)
  const imgSrc = $('.title-col .image img').data('src-desktop')

  return imgSrc ? `https://tvheute.at${imgSrc}` : null
}

function parseStart(item) {
  const $ = cheerio.load(item)
  const time = $('.end-col > .duration-wrapper').data('start')

  return dayjs(time)
}

function parseStop(item) {
  const $ = cheerio.load(item)
  const time = $('.end-col > .duration-wrapper').data('stop')

  return dayjs(time)
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#showListContainer > table > tbody > tr').toArray()
}
