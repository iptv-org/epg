const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const axios = require('axios')
const _ = require('lodash')
const cheerio = require('cheerio')

dayjs.extend(utc)
dayjs.extend(timezone)

const endpoint = `https://www.rev.bs/wp-content/uploads/tv-guide/$date_$index.json`

module.exports = {
  site: 'rev.bs',
  url: function ({ date }) {
    return endpoint.replace('$date', date.format('YYYY-MM-DD')).replace('$index', 0)
  },
  logo: async function ({ channel }) {
    const html = await axios
      .get('https://www.rev.bs/tv-guide')
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(html)
    const script = $('body > script:nth-child(2)').html()
    let channels = script.match(/Rev.TVGuide.channels = (.*);/i)[1] || ''
    channels = JSON.parse(channels)
    if (!channels[channel.site_id]) return null

    return `https:${channels[channel.site_id].channel_image}`
  },
  parser: async function ({ content, channel, date }) {
    const programs = []
    const items0 = parseItems(content, channel)
    const items1 = parseItems(await loadNextItems(date, 1), channel)
    const items2 = parseItems(await loadNextItems(date, 2), channel)
    const items3 = parseItems(await loadNextItems(date, 3), channel)
    const items = _.unionBy(items0, items1, items2, items3, 'sid')
    items.forEach(item => {
      const start = parseStart(item, date)
      const stop = start.add(item.duration, 'm')
      programs.push({
        title: item.title,
        start,
        stop
      })
    })

    return programs
  }
}

async function loadNextItems(date, index) {
  const url = endpoint.replace('$date', date.format('YYYY-MM-DD')).replace('$index', index)

  return axios
    .get(url, {
      responseType: 'arraybuffer'
    })
    .then(res => res.data.toString())
    .catch(e => ({}))
}

function parseStart(item, d) {
  const shift = parseInt(item.s)

  return dayjs.tz(d.add(shift, 'm').toString(), 'America/New_York')
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (data.status !== 'OK') return []

  return data.data.schedule[channel.site_id]
}
