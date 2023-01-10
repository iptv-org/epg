const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'beinsports.com',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000, // 1h
      interpretHeader: false
    }
  },
  url: function ({ date, channel }) {
    let [region] = channel.site_id.split('#')
    region = region ? `_${region}` : ''

    return `https://epg.beinsports.com/utctime${region}.php?mins=00&serviceidentity=beinsports.com&cdate=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  parser: function ({ content, channel, date, cached }) {
    let programs = []
    const items = parseItems(content, channel)
    let i = 0
    items.forEach(item => {
      const $item = cheerio.load(item)
      const title = parseTitle($item)
      if (!title) return
      const category = parseCategory($item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      if (i === 0 && start.hour() > 18) {
        date = date.subtract(1, 'd')
        start = start.subtract(1, 'd')
      }
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      let stop = parseStop($item, start)
      if (stop.isBefore(start)) {
        stop = stop.add(1, 'd')
      }

      programs.push({ title, category, start, stop })
      i++
    })

    return programs
  },
  async channels({ region, lang }) {
    const suffix = region ? `_${region}` : ''
    const content = await axios
      .get(
        `https://epg.beinsports.com/utctime${suffix}.php?mins=00&serviceidentity=beinsports.com&cdate=2022-05-08`
      )
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(content)
    const items = $(`.container > div, #epg_div > div`).toArray()
    return items
      .map(item => {
        const $item = cheerio.load(item)
        const id = $item('*').attr('id')
        if (!/^channels\_[0-9]+$/.test(id)) return null
        const channelId = id.replace('channels_', '')
        const imgSrc = $item('img').attr('src')
        const [_, __, name] = imgSrc.match(/(\/|)([a-z0-9-_.]+)(.png|.svg)$/i) || [null, null, '']

        return {
          lang,
          site_id: `${region}#${channelId}`,
          name
        }
      })
      .filter(i => i)
  }
}

function parseTitle($item) {
  return $item('.title').text()
}

function parseCategory($item) {
  return $item('.format')
    .map(function () {
      return $item(this).text()
    })
    .get()
}

function parseStart($item, date) {
  let time = $item('.time').text()
  if (!time) return null
  let [_, start, period] = time.match(/^(\d{2}:\d{2})( AM| PM|)/) || [null, null, null]
  if (!start) return null
  start = `${date.format('YYYY-MM-DD')} ${start}${period}`
  const format = period ? 'YYYY-MM-DD hh:mm A' : 'YYYY-MM-DD HH:mm'

  return dayjs.tz(start, format, 'Asia/Qatar')
}

function parseStop($item, date) {
  let time = $item('.time').text()
  if (!time) return null
  let [_, stop, period] = time.match(/(\d{2}:\d{2})( AM| PM|)$/) || [null, null, null]
  if (!stop) return null
  stop = `${date.format('YYYY-MM-DD')} ${stop}${period}`
  const format = period ? 'YYYY-MM-DD hh:mm A' : 'YYYY-MM-DD HH:mm'

  return dayjs.tz(stop, format, 'Asia/Qatar')
}

function parseItems(content, channel) {
  const [_, channelId] = channel.site_id.split('#')
  const $ = cheerio.load(content)

  return $(`#channels_${channelId} .slider > ul:first-child > li`).toArray()
}
