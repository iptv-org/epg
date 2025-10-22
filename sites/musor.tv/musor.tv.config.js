const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0'
}

module.exports = {
  site: 'musor.tv',
  days: 2,
  request: { headers },
  url({ channel, date }) {
    return dayjs.utc().isSame(date, 'd')
      ? `https://musor.tv/mai/tvmusor/${channel.site_id}`
      : `https://musor.tv/napi/tvmusor/${channel.site_id}/${date.format('YYYY.MM.DD')}`
  },
  parser({ content }) {
    const programs = []
    const [$, items] = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = $(item)
      let start = parseStart($item)
      if (prev) prev.stop = start
      const stop = start.add(30, 'm')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        image: parseImage($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const html = await axios
      .get('https://musor.tv/', { headers })
      .then(r => r.data)
      .catch(console.error)

    const $ = cheerio.load(html)
    const channels = $('body > div.big_content > div > nav > table > tbody > tr > td > a').toArray()
    return channels
      .map(item => {
        const $item = $(item)
        const url = $item.attr('href')
        if (!url.startsWith('//musor.tv/mai/tvmusor/')) return null
        const site_id = url.replace('//musor.tv/mai/tvmusor/', '')
        return {
          lang: 'hu',
          site_id,
          name: $item.text()
        }
      })
      .filter(i => i)
  }
}

function parseImage($item) {
  const imgSrc = $item.find('div.smartpe_screenshot > img').attr('src')

  return imgSrc ? `https:${imgSrc}` : null
}

function parseTitle($item) {
  return $item.find('div:nth-child(2) > div > h3 > a').text().trim()
}

function parseDescription($item) {
  return $item.find('div:nth-child(5) > div > div').text().trim()
}

function parseStart($item) {
  let datetime = $item.find('div:nth-child(1) > div > div > div > div > time').attr('content')
  if (!datetime) return null

  return dayjs.utc(datetime.replace('GMT', 'T'), 'YYYY-MM-DDTHH:mm:ss')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return [$, $('div.multicolumndayprogarea > div.smartpe_progentry').toArray()]
}
