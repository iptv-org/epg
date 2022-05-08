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
  url: function ({ date, channel }) {
    let [region] = channel.site_id.split('#')
    region = region ? `_${region}` : ''

    return `https://epg.beinsports.com/utctime${region}.php?mins=00&serviceidentity=beinsports.com&cdate=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel)
    date = date.subtract(1, 'd')
    items.forEach(item => {
      const $item = cheerio.load(item)
      const title = parseTitle($item)
      if (!title) return
      const category = parseCategory($item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
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
      programs.push({
        title,
        category,
        start,
        stop
      })
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
  return $item('.format').text()
}

function parseStart($item, date) {
  let [_, time] = $item('.time')
    .text()
    .match(/^(\d{2}:\d{2})/) || [null, null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Asia/Qatar')
}

function parseStop($item, date) {
  let [_, time] = $item('.time')
    .text()
    .match(/(\d{2}:\d{2})$/) || [null, null]
  if (!time) return null
  time = `${date.format('YYYY-MM-DD')} ${time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Asia/Qatar')
}

function parseItems(content, channel) {
  const [_, channelId] = channel.site_id.split('#')
  const $ = cheerio.load(content)

  return $(`#channels_${channelId} .slider > ul:first-child > li`).toArray()
}
