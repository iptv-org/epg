const dayjs = require('dayjs')
const axios = require('axios')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'cablego.com.pe',
  days: 2,
  request: {
    method: 'POST',
    headers: {
      'x-requested-with': 'XMLHttpRequest'
    },
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ channel, date }) {
    const [page] = channel.site_id.split('#')

    return `https://cablego.com.pe/epg/default/${date.format(
      'YYYY-MM-DD'
    )}?page=${page}&do=loadPage`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      if (!start) return
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
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const promises = [0, 1, 2, 3, 4].map(page => {
      return axios.post(
        `https://cablego.com.pe/epg/default/2022-11-28?page=${page}&do=loadPage`,
        null,
        {
          headers: {
            'x-requested-with': 'XMLHttpRequest'
          }
        }
      )
    })

    const channels = []
    await Promise.allSettled(promises).then(results => {
      results.forEach((r, page) => {
        if (r.status === 'fulfilled') {
          const html = r.value.data.snippets['snippet--channelGrid']
          const $ = cheerio.load(html)
          $('.epg-channel-strip').each((i, el) => {
            const channelId = $(el).find('.epg-channel-logo').attr('id')
            channels.push({
              lang: 'es',
              site_id: `${page}#${channelId}`,
              name: $(el).find('img').attr('alt')
            })
          })
        }
      })
    })

    return channels
  }
}

function parseTitle($item) {
  return $item('span:nth-child(2) > a').text().trim()
}

function parseStart($item, date) {
  const time = $item('.epg-show-start').text().trim()

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'America/Lima')
}

function parseItems(content, channel) {
  const [, channelId] = channel.site_id.split('#')
  const data = JSON.parse(content)
  if (!data || !data.snippets || !data.snippets['snippet--channelGrid']) return []
  const html = data.snippets['snippet--channelGrid']
  const $ = cheerio.load(html)

  return $(`#${channelId}`).parent().find('.epg-show').toArray()
}
