const doFetch = require('@ntlab/sfetch')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const tz = 'Europe/Helsinki'

module.exports = {
  site: 'tvkaista.org',
  days: 2,
  url({ channel, date }) {
    return `https://www.tvkaista.org/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  parser({ content, date }) {
    let programs = []
    const items = parseItems(content)

    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)

      let start = parseStart($item, date)
      let stop = parseStop($item, start)

      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        } else if (stop.isBefore(start)) {
          stop = stop.add(1, 'd')
          date = date.add(1, 'd')
        }
      } else {
        if (start.hour() > 18) {
          start = start.subtract(1, 'd')
          date = date.subtract(1, 'd')
        }
      }

      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        season: parseSeason($item),
        episode: parseEpisode($item),
        categories: parseCategories($item),
        rating: parseRating($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    let channels = []

    const queue = ['https://www.tvkaista.org/', 'https://www.tvkaista.org/maksukanavat/']
    await doFetch(queue, (url, res) => {
      const $ = cheerio.load(res)
      $('body > main > div > div.row > div').each((i, el) => {
        const link = $(el).find('div > div > div > div.col-auto > a')
        const img = link.find('img.channel-logo')
        const name = link.text().trim() || img.attr('alt')
        const [, site_id] = link.attr('href').split('/')

        channels.push({
          lang: 'fi',
          name,
          site_id
        })
      })
    })

    return channels
  }
}

function parseRating($item) {
  let rating = $item(
    'div.d-flex.flex-row.bd-highlight > div.bd-highlight.flex-fill > span:nth-child(3) > img'
  ).attr('alt')

  return rating
    ? {
        system: 'VET',
        value: rating.replace(/\(|\)/g, '')
      }
    : null
}

function parseCategories($item) {
  return $item('div.collapse > .badge')
    .map((i, el) => $item(el).text().trim())
    .get()
}

function parseSeason($item) {
  const string = $item(
    'div.d-flex.flex-row.bd-highlight > div.bd-highlight.flex-fill > span:nth-child(2)'
  )
    .text()
    .trim()
  if (!string) return null

  let [, season] = string.match(/S(\d{2})/) || [null, null]

  return season ? parseInt(season) : null
}

function parseEpisode($item) {
  const string = $item(
    'div.d-flex.flex-row.bd-highlight > div.bd-highlight.flex-fill > span:nth-child(2)'
  )
    .text()
    .trim()
  if (!string) return null

  let [, episode] = string.match(/E(\d{2})/) || [null, null]

  return episode ? parseInt(episode) : null
}

function parseStart($item, date) {
  const [time] = $item('div.d-flex.flex-row.bd-highlight > div.bd-highlight.me-2')
    .text()
    .trim()
    .split('-')

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', tz)
}

function parseStop($item, date) {
  const [, time] = $item('div.d-flex.flex-row.bd-highlight > div.bd-highlight.me-2')
    .text()
    .trim()
    .split('-')

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', tz)
}

function parseTitle($item) {
  return $item('div.d-flex.flex-row.bd-highlight > div.bd-highlight.flex-fill > span:nth-child(1)')
    .text()
    .trim()
}

function parseDescription($item) {
  return (
    $item('div.collapse > p')
      .text()
      .replace(/\n/g, '')
      .replace(/\s\s+/g, ' ')
      // eslint-disable-next-line no-irregular-whitespace
      .replace(/ /g, ' ')
      .trim()
  )
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('ul.list-group > li').toArray()
}
