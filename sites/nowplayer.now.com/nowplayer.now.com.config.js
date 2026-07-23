const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const doFetch = require('@ntlab/sfetch')

dayjs.extend(utc)

const eventIds = {}
const cookies = {}
const caches = {}

module.exports = {
  site: 'nowplayer.now.com',
  days: 2,
  url({ channel, date }) {
    const diff = date.diff(dayjs.utc().startOf('d'), 'd') + 1

    return `https://nowplayer.now.com/tvguide/epglist?channelIdList[]=${channel.site_id}&day=${diff}`
  },
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    },
    headers({ channel }) {
      return {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0',
        'cookie': Object.entries({ ...cookies, LANG: channel.lang})
          .map(a => `${a[0]}=${a[1]}`)
          .join('; ')
      }
    }
  },
  async parser({ content, channel, headers }) {
    const programs = []
    parseCookies(headers)
    const items = parseItems(content)
    if (items.length) {
      if (eventIds[channel.lang] === undefined) {
        eventIds[channel.lang] = []
      }
      const queues = items
        .filter(item => item.vimProgramId && !eventIds[channel.lang].includes(item.vimProgramId))
        .map(item => {
          const url = `https://nowplayer.now.com/tvguide/epgprogramdetail?programId=${item.vimProgramId}`
          if (caches[url] !== undefined) {
            item.detail = caches[url]
          } else {
            return {
              url,
              params: { headers: module.exports.request.headers({ channel }) },
              item
            }
          }
        })
        .filter(Boolean)
      const worker = process.env.EPG_DETAILED_GUIDE_WORKER || 10
      const delay = process.env.EPG_DETAILED_GUIDE_DELAY || 500
      await doFetch(queues, { worker }, async (queue, res, headers) => {
        parseCookies(headers)
        queue.item.detail = res
        caches[queue.url] = res
        await new Promise(resolve => setTimeout(resolve, delay))
      })
      items.forEach(item => {
        eventIds[channel.lang].push(item.vimProgramId)
        programs.push({
          title: (channel.lang === 'zh' ? item.detail?.chiProgName : item.detail?.progName) || item.name,
          description: channel.lang === 'zh' ? item.detail?.chiSynopsis : item.detail?.synopsis,
          categories: [item.detail?.genre, item.detail?.subGenre].filter(Boolean),
          actor: item.detail?.actor?.split(',').map(a => a.trim()),
          director: item.detail?.director?.split(',').map(a => a.trim()),
          year: item.detail?.firstReleaseYear?.toString(),
          start: getDate(item.start),
          stop: getDate(item.end)
        })
      })
    }

    return programs
  },
  async channels({ lang }) {
    const html = await axios
      .get('https://nowplayer.now.com/channels', { headers: { Accept: 'text/html' } })
      .then(r => r.data)
      .catch(console.log)

    const channels = []

    const $ = cheerio.load(html)
    $('body > div.container > .tv-guide-s-g > div > div').each((i, el) => {
      channels.push({
        lang,
        site_id: $(el).find('.guide-g-play > p.channel').text().replace('CH', ''),
        name: $(el).find('.thumbnail > a > span.image > p').text()
      })
    })

    return channels
  }
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data)) return []

  return Array.isArray(data[0]) ? data[0] : []
}

function parseCookies(headers) {
  if (headers && Array.isArray(headers['set-cookie'])) {
    headers['set-cookie']
      .map(cookie => cookie.split(';')[0].trim())
      .forEach(cookie => {
        const [k, v] = [
          cookie.substr(0, cookie.indexOf('=')),
          cookie.substr(cookie.indexOf('=') + 1),
        ]
        cookies[k] = v
      })
  }
}

function getDate(dt) {
  return dayjs.utc(dt)
}
