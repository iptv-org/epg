const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const headers = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'accept-language': 'en',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
}

module.exports = {
  site: 'mi.tv',
  days: 2,
  request: { headers },
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
  const styleAttr = $item('a > div.image-parent > div.image').attr('style')
  
  if (styleAttr) {
    const match = styleAttr.match(/background-image:\s*url\(['"]?(.*?)['"]?\)/)
    if (match) {
      return cleanUrl(match[1])
    }
  }
  
  const backgroundImage = $item('a > div.image-parent > div.image').css('background-image')
  
  if (backgroundImage && backgroundImage !== 'none') {
    const match = backgroundImage.match(/url\(['"]?(.*?)['"]?\)/)
    if (match) {
      return cleanUrl(match[1])
    }
  }
  
  return null
}

function cleanUrl(url) {
  if (!url) return null
  
  return url
    .replace(/^['"`\\]+/, '')
    .replace(/['"`\\]+$/, '')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}


function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#listings > ul > li').toArray()
}