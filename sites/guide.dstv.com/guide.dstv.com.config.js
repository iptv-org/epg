const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'guide.dstv.com',
  skip: true, // NOTE: website is down (HTTP Server Error 503)
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000,
      interpretHeader: false
    }
  },
  url({ channel, date }) {
    const [bouquetId] = channel.site_id.split('#')

    return `https://guide.dstv.com/api/gridview/page?bouquetId=${bouquetId}&genre=all&date=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  parser({ content, date, channel, cached }) {
    const programs = []
    const items = parseItems(content, date, channel)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      let start = parseStart(item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      } else if (start.hour() > 12) {
        start = start.subtract(1, 'd')
        date = date.subtract(1, 'd')
      }
      const stop = start.add(1, 'h')
      programs.push({
        title: item.title,
        start,
        stop
      })
    })

    return programs
  },
  async channels({ bouquet }) {
    const data = await axios
      .get(
        `https://guide.dstv.com/api/channel/fetchChannelsByGenresInBouquet?bouquetId=${bouquet}&genre=all`
      )
      .then(r => r.data)
      .catch(console.log)

    const items = data.items
    return items.map(item => {
      return {
        lang: 'en',
        site_id: `${bouquet}#${item.channelTag}`,
        name: item.channelName
      }
    })
  }
}

function parseStart(item, date) {
  time = `${date.format('MM/DD/YYYY')} ${item.time}`

  return dayjs.utc(time, 'MM/DD/YYYY HH:mm')
}

function parseItems(content, date, channel) {
  const [_, channelTag] = channel.site_id.split('#')
  const data = JSON.parse(content)
  const html = data[channelTag]
  if (!html) return []
  const $ = cheerio.load(html)

  return $('li')
    .map((i, el) => {
      return {
        time: $(el).find('.event-time').text().trim(),
        title: $(el).find('.event-title').text().trim()
      }
    })
    .toArray()
    .filter(i => i.time && i.title)
}
