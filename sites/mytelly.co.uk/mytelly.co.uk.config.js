const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'mytelly.co.uk',
  days: 2,
  url: function ({ date, channel }) {
    return `https://www.mytelly.co.uk/tv-guide/listings/channel/${
      channel.site_id
    }.html?dt=${date.format('YYYY-MM-DD')}`
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

    const providers = [
      '-3000053',
      '-4000118',
      '-11000199',
      '-1000007',
      '-2000007',
      '-12000220',
      '-5000136',
      '-10000178'
    ]
    const regions = [
      'Cambridgeshire',
      'Channel Islands',
      'Cumbria',
      'East',
      'East Midlands',
      'Yorkshire &amp; Lincolnshire',
      'London',
      'North East',
      'North West',
      'Northern Ireland',
      'Oxfordshire',
      'Scotland (Borders)',
      'Scotland (Central)',
      'Scotland (North)',
      'South',
      'South East',
      'South West',
      'Wales',
      'West',
      'West Midlands',
      'Yorkshire'
    ]

    const channels = []
    for (let provider of providers) {
      for (let region of regions) {
        const data = await axios
          .post(`https://www.mytelly.co.uk/tv-guide/schedule`, null, {
            params: {
              provider,
              region,
              TVperiod: 'Night',
              date: dayjs().format('YYYY-MM-DD'),
              st: 0,
              u_time: 1955,
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
    }

    return [...new Map(channels.map(item => [item.site_id, item])).values()]
  }
}

function parseStart($item, date, channel) {
  const timeString = $item('td:eq(0)').text().trim()
  const dateString = `${date.format('YYYY-MM-DD')} ${timeString}`

  return dayjs.tz(dateString, 'YYYY-MM-DD H:mm a', 'Europe/London')
}

function parseTitle($item) {
  return $item('td:eq(1)').text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('table.table > tbody > tr').toArray()
}
