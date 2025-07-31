const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'nowplayer.now.com',
  days: 2,
  url: function ({ channel, date }) {
    const diff = date.diff(dayjs.utc().startOf('d'), 'd') + 1

    return `https://nowplayer.now.com/tvguide/epglist?channelIdList[]=${channel.site_id}&day=${diff}`
  },
  request: {
    headers({ channel }) {
      return {
        Cookie: `LANG=${channel.lang}; Expires=null; Path=/; Domain=nowplayer.now.com`
      }
    }
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.name,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels({ lang }) {
    const html = await axios
      .get('https://nowplayer.now.com/channels', { headers: { Accept: 'text/html' } })
      .then(r => r.data)
      .catch(console.log)

    let channels = []

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

function parseStart(item) {
  return dayjs(item.start)
}

function parseStop(item) {
  return dayjs(item.end)
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data)) return []

  return Array.isArray(data[0]) ? data[0] : []
}
