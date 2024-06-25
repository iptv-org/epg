const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tvireland.ie',
  days: 2,
  url: function ({ date, channel }) {
    return `https://www.tvireland.ie/tv/listings/channel/${channel.site_id}?dt=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  parser: function ({ content, date, channel }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date, channel)
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
    const axios = require('axios')

    const providers = ['-9000019', '-8000019', '-1000019', '-2000019', '-7000019']

    const channels = []
    for (let provider of providers) {
      const data = await axios
        .post(`https://www.tvireland.ie/tv/schedule`, null, {
          params: {
            provider,
            region: 'Ireland',
            TVperiod: 'Night',
            date: dayjs().format('YYYY-MM-DD'),
            st: 0,
            u_time: 2027,
            is_mobile: 1
          }
        })
        .then(r => r.data)
        .catch(console.log)

      const $ = cheerio.load(data)
      $('.channelname').each((i, el) => {
        const name = $(el).find('center > a:eq(1)').text()
        const url = $(el).find('center > a:eq(1)').attr('href')
        const [, number, slug] = url.match(/\/(\d+)\/(.*)\.html$/)

        channels.push({
          lang: 'en',
          name,
          site_id: `${number}/${slug}`
        })
      })
    }

    return [...new Map(channels.map(channel => [channel.site_id, channel])).values()]
  }
}

function parseStart($item, date, channel) {
  const timeString = $item('td:eq(0)').text().trim()
  const dateString = `${date.format('YYYY-MM-DD')} ${timeString}`

  return dayjs.tz(dateString, 'YYYY-MM-DD H:mm a', 'Europe/Dublin')
}

function parseTitle($item) {
  return $item('td:eq(1)').text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('table.table > tbody > tr').toArray()
}
