const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'ontvtonight.com',
  days: 2,
  url: function ({ date, channel }) {
    const [region, id] = channel.site_id.split('#')
    let url = 'https://www.ontvtonight.com'
    if (region && region !== 'us') url += `/${region}`
    url += `/guide/listings/channel/${id}.html?dt=${date.format('YYYY-MM-DD')}`

    return url
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
      const stop = start.add(1, 'h')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels({ country }) {
    const axios = require('axios')

    const providers = {
      au: ['o', 'a'],
      ca: [
        'Y464014423',
        '-464014503',
        '-464014594',
        '-464014738',
        'X3153330286',
        'X464014503',
        'X464013696',
        'X464014594',
        'X464014738',
        'X464014470',
        'X464013514',
        'X1210684931',
        'T3153330286',
        'T464014503',
        'T1810267316',
        'T1210684931'
      ],
      us: [
        'Y341768590',
        'Y1693286984',
        'Y8833268284',
        '-341767428',
        '-341769166',
        '-341769884',
        '-3679985536',
        '-341766967',
        'X4100694897',
        'X341767428',
        'X341768182',
        'X341767434',
        'X341768272',
        'X341769884',
        'X3679985536',
        'X3679984937',
        'X341764975',
        'X3679985052',
        'X341766967',
        'K4805071612',
        'K5039655414'
      ]
    }
    const regions = {
      au: [
        1, 2, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 17, 18, 29, 28, 27, 26, 25, 23, 22,
        21, 20, 19, 24, 30, 31, 32, 33, 34, 35, 36, 39, 38, 37, 40, 41, 42, 43, 44, 45, 46, 47, 48,
        49, 50, 51, 52, 53
      ],
      ca: [null],
      us: [null]
    }
    const zipcodes = {
      au: [null],
      ca: ['M5G1P5', 'H3B1X8', 'V6Z2H7', 'T2P3E6', 'T5J2Z2', 'K1P1B1'],
      us: [10199, 90052, 60607, 77201, 85026, 19104, 78284, 92199, 75260]
    }

    const channels = []
    for (let provider of providers[country]) {
      for (let zipcode of zipcodes[country]) {
        for (let region of regions[country]) {
          let url = 'https://www.ontvtonight.com'
          if (country === 'us') url += '/guide/schedule'
          else url += `/${country}/guide/schedule`
          const data = await axios
            .post(url, null, {
              params: {
                provider,
                region,
                zipcode,
                TVperiod: 'Night',
                date: dayjs().format('YYYY-MM-DD'),
                st: 0,
                is_mobile: 1
              }
            })
            .then(r => r.data)
            .catch(console.log)

          const $ = cheerio.load(data)
          $('.channelname').each((i, el) => {
            let name = $(el).find('center > a:eq(1)').text()
            name = name.replace(/\-\-/gi, '-')
            const url = $(el).find('center > a:eq(1)').attr('href')
            if (!url) return
            const [, number, slug] = url.match(/\/(\d+)\/(.*)\.html$/)

            channels.push({
              lang: 'en',
              name,
              site_id: `${country}#${number}/${slug}`
            })
          })
        }
      }
    }

    return [...new Map(channels.map(item => [item.site_id, item])).values()]
  }
}

function parseStart($item, date, channel) {
  const timezones = {
    au: 'Australia/Sydney',
    ca: 'America/Toronto',
    us: 'America/New_York'
  }
  const [region] = channel.site_id.split('#')
  const timeString = $item('td:nth-child(1) > h5').text().trim()
  const dateString = `${date.format('YYYY-MM-DD')} ${timeString}`

  return dayjs.tz(dateString, 'YYYY-MM-DD H:mm a', timezones[region])
}

function parseTitle($item) {
  return $item('td:nth-child(2) > h5').text().trim()
}

function parseDescription($item) {
  return $item('td:nth-child(2) > h6').text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#content > div > div > div.span6 > table > tbody > tr').toArray()
}
