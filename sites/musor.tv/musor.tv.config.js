const cheerio = require('cheerio')
const dayjs = require('dayjs')
const axios = require('axios')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'musor.tv',
  days: 2,
  url({ channel, date }) {
    return dayjs.utc().isSame(date, 'd')
      ? `https://musor.tv/mai/tvmusor/${channel.site_id}`
      : `https://musor.tv/napi/tvmusor/${channel.site_id}/${date.format('YYYY.MM.DD')}`
  },
  parser({ content }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item)
      if (prev) prev.stop = start
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
  },
  async channels() {
    const html = await axios
      .get(`https://musor.tv/`)
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(html)
    const channels = $('body > div.big_content > div > nav > table > tbody > tr > td > a').toArray()
    return channels
      .map(item => {
        const $item = cheerio.load(item)
        const url = $item('*').attr('href')
        if (!url.startsWith('//musor.tv/mai/tvmusor/')) return null
        const site_id = url.replace('//musor.tv/mai/tvmusor/', '')
        return {
          lang: 'hu',
          site_id,
          name: $item('*').text()
        }
      })
      .filter(i => i)
  }
}

function parseIcon($item) {
  const imgSrc = $item('div.smartpe_screenshot > img').attr('src')

  return imgSrc ? `https:${imgSrc}` : null
}

function parseTitle($item) {
  return $item('div:nth-child(2) > div > h3 > a').text().trim()
}

function parseDescription($item) {
  return $item('div:nth-child(5) > div > div').text().trim()
}

function parseStart($item) {
  let datetime = $item('div:nth-child(1) > div > div > div > div > time').attr('content')
  if (!datetime) return null

  return dayjs.utc(datetime.replace('GMT', 'T'), 'YYYY-MM-DDTHH:mm:ss')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('div.multicolumndayprogarea > div.smartpe_progentry').toArray()
}
