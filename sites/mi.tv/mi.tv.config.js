const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'mi.tv',
  days: 2,
  url({ date, channel }) {
    const [country, id] = channel.site_id.split('#')

    return `https://mi.tv/${country}/async/channel/${id}/${date.format('YYYY-MM-DD')}/0`
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
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(1, 'h')
      programs.push({
        title: parseTitle($item),
        category: parseCategory($item),
        description: parseDescription($item),
        image: parseImage($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels({ country }) {
    let lang = 'es'
    if (country === 'br') lang = 'pt'

    const axios = require('axios')
    const data = await axios
      .get(`https://mi.tv/${country}/sitemap`)
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(data)

    let channels = []
    $(`#page-contents a[href*="${country}/canales"], a[href*="${country}/canais"]`).each(
      (i, el) => {
        const name = $(el).text()
        const url = $(el).attr('href')
        const [, , , channelId] = url.split('/')

        channels.push({
          lang,
          name,
          site_id: `${country}#${channelId}`
        })
      }
    )

    return channels
  }
}

function parseStart($item, date) {
  const timeString = $item('a > div.content > span.time').text()
  if (!timeString) return null
  const dateString = `${date.format('MM/DD/YYYY')} ${timeString}`

  return dayjs.utc(dateString, 'MM/DD/YYYY HH:mm')
}

function parseTitle($item) {
  return $item('a > div.content > h2').text().trim()
}

function parseCategory($item) {
  return $item('a > div.content > span.sub-title').text().trim()
}

function parseDescription($item) {
  return $item('a > div.content > p.synopsis').text().trim()
}

function parseImage($item) {
  const backgroundImage = $item('a > div.image-parent > div.image').css('background-image')
  const [, image] = backgroundImage.match(/url\('(.*)'\)/) || [null, null]

  return image
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#listings > ul > li').toArray()
}
