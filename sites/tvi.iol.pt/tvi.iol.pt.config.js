const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tvi.iol.pt',
  url({ channel, date }) {
    return `https://tvi.iol.pt/emissao/dia/${channel.site_id}?data=${date.format('YYYY-MM-DD')}`
  },
  parser({ content, date }) {
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
        icon: parseIcon($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseTitle($item) {
  return $item('.guiatv-programa > h2').text().trim()
}

function parseDescription($item) {
  return $item('.guiatv-programa > .texto, .guiatv-programa > .texto2').text().trim() || null
}

function parseIcon($item) {
  const backgroundImage = $item('.picture16x9').css('background-image')
  if (!backgroundImage) return null
  const [, imageUrl] = backgroundImage.match(/url\((.*)\)/) || [null, null]
  if (!imageUrl) return null

  return imageUrl
}

function parseStart($item, date) {
  const timezone = 'Europe/Madrid'
  const time = $item('.hora').text().trim()

  return dayjs.tz(`${date.tz(timezone).format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', timezone)
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('.guiatv-linha').toArray()
}
