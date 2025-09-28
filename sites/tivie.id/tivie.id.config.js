const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const doFetch = require('@ntlab/sfetch')
const debug = require('debug')('site:tivie.id')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

doFetch.setDebugger(debug)

const tz = 'Asia/Jakarta'

module.exports = {
  site: 'tivie.id',
  days: 2,
  url({ channel, date }) {
    return `https://tivie.id/channel/${channel.site_id}/${date.format('YYYYMMDD')}`
  },
  async parser({ content, date }) {
    const programs = []
    if (content) {
      const $ = cheerio.load(content)
      const items = $('ul[x-data] > li[id*="event-"] > div.w-full')
        .toArray()
        .map(item => {
          const $item = $(item)
          const time = $item.find('div:nth-child(1) span:nth-child(1)')
          const info = $item.find('div:nth-child(2) h5')
          const detail = info.find('a')
          const p = {
            start: dayjs.tz(`${date.format('YYYY-MM-DD')} ${time.html()}`, 'YYYY-MM-DD HH:mm', tz)
          }
          if (detail.length) {
            const subtitle = detail.find('div')
            p.title = parseText(subtitle.length ? subtitle : detail)
            p.url = detail.attr('href')
          } else {
            p.title = parseText(info)
          }
          if (p.title) {
            const [, , season, episode] = p.title.match(/( S(\d+))?, Ep\. (\d+)/) || [
              null,
              null,
              null,
              null
            ]
            if (season) {
              p.season = parseInt(season)
            }
            if (episode) {
              p.episode = parseInt(episode)
            }
          }
          return p
        })
      // fetch detailed guide if necessary
      const queues = items
        .filter(i => i.url)
        .map(i => {
          const url = i.url
          delete i.url
          return { i, url }
        })
      if (queues.length) {
        await doFetch(queues, (queue, res) => {
          const $ = cheerio.load(res)
          const img = $('#main-content > div > div:nth-child(1) img')
          const info = $('#main-content > div > div:nth-child(2)')
          const title = parseText(info.find('h2:nth-child(2)'))
          if (!queue.i.title.startsWith(title) && !queue.i.title.startsWith('LIVE ')) {
            queue.i.subTitle = parseText(info.find('h2:nth-child(2)'))
          }
          const desc1 = parseText(info.find('div[class=""]:nth-child(3)'))
          const desc2 = parseText(info.find('div[class=""]:nth-child(4)'))
          if (desc2 == '') {
            queue.i.description = desc1.replace('TiViE.id | ', '')
          } else {
            queue.i.description = desc2.replace('TiViE.id | ', '')
            queue.i.date = parseText(info.find('h2:nth-child(3)'))
          }
          queue.i.categories = parseText(info.find('div[class=""]:nth-child(1)')).split(', ')
          queue.i.image = img.length ? img.attr('src') : null
        })
      }
      // fill start-stop
      for (let i = 0; i < items.length; i++) {
        if (i < items.length - 1) {
          items[i].stop = items[i + 1].start
        } else {
          items[i].stop = dayjs.tz(
            `${date.add(1, 'd').format('YYYY-MM-DD')} 00:00`,
            'YYYY-MM-DD HH:mm',
            tz
          )
        }
      }
      // add programs
      programs.push(...items)
    }

    return programs
  },
  async channels({ lang = 'id' }) {
    const result = await axios
      .get('https://tivie.id/channel')
      .then(response => response.data)
      .catch(console.error)

    const $ = cheerio.load(result)
    const items = $('ul[x-data] li[x-data] div header h2 a').toArray()
    const channels = items.map(item => {
      const $item = $(item)
      const url = $item.attr('href')
      return {
        lang,
        site_id: url.substr(url.lastIndexOf('/') + 1),
        name: $item.find('strong').text()
      }
    })

    return channels
  }
}

function parseText($item) {
  let text = $item.text().replace(/\t/g, '').replace(/\n/g, ' ').trim()
  while (true) {
    if (text.match(/\s\s/)) {
      text = text.replace(/\s\s/g, ' ')
      continue
    }
    break
  }

  return text
}
