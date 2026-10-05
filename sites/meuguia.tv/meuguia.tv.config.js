const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'meuguia.tv',
  days: 2,
  url({ channel }) {
    return `https://meuguia.tv/programacao/canal/${channel.site_id}`
  },
  parser({ content, date }) {
    const programs = []
    parseItems(content, date).forEach(item => {
      if (dayjs.utc(item.start).isSame(date, 'day')) {
        programs.push(item)
      }
    })

    return programs
  },
  async channels() {
    const channels = []
    const axios = require('axios')
    const baseUrl = 'https://meuguia.tv'

    let seq = 0
    const queues = [baseUrl]
    while (true) {
      if (!queues.length) {
        break
      }
      const url = queues.shift()
      const content = await axios
        .get(url)
        .then(response => response.data)
        .catch(console.error)

      if (content) {
        const [$, items] = getItems(content)
        if (seq === 0) {
          queues.push(...items.map(category => baseUrl + $(category).attr('href')))
        } else {
          items.forEach(item => {
            const href = $(item).attr('href')
            channels.push({
              lang: 'pt',
              site_id: href.substr(href.lastIndexOf('/') + 1),
              name: $(item).find('.licontent h2').text().trim()
            })
          })
        }
      }
      seq++
    }

    return channels
  }
}

function getItems(content) {
  const $ = cheerio.load(content)
  return [$, $('div.mw ul li a').toArray()]
}

function parseItems(content, date) {
  const result = []
  const $ = cheerio.load(content)

  let lastDate
  for (const item of $('ul.mw li').toArray()) {
    const $item = $(item)
    if ($item.hasClass('subheader')) {
      lastDate = `${$item.text().split(', ')[1]}/${date.format('YYYY')}`
    } else if ($item.hasClass('divider')) {
      // ignore
    } else if (lastDate) {
      const data = { title: $item.find('a').attr('title').trim() }
      const ep = data.title.match(/T(\d+) EP(\d+)/)
      if (ep) {
        data.season = parseInt(ep[1])
        data.episode = parseInt(ep[2])
      }
      data.start = dayjs.tz(
        `${lastDate} ${$item.find('.time').text()}`,
        'DD/MM/YYYY HH:mm',
        'America/Sao_Paulo'
      )
      result.push(data)
    }
  }
  // use stop time from next item
  if (result.length > 1) {
    for (let i = 0; i < result.length - 1; i++) {
      result[i].stop = result[i + 1].start
    }
  }

  return result
}
