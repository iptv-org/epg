const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'dstv.com',
  url({ channel, date }) {
    const [bouquetId] = channel.site_id.split('#')

    return `https://guide.dstv.com/api/gridview/page?bouquetId=${bouquetId}&genre=all&date=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  logo({ channel }) {
    return channel.logo
  },
  parser({ content, date, channel }) {
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
