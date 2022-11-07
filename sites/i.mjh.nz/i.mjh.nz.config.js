const dayjs = require('dayjs')
const axios = require('axios')
const parser = require('epg-parser')
const isBetween = require('dayjs/plugin/isBetween')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(isBetween)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'i.mjh.nz',
  request: {
    cache: {
      ttl: 6 * 60 * 60 * 1000 // 6h
    },
    maxContentLength: 15 * 1024 * 1024 // 15Mb
  },
  url: function ({ channel }) {
    const [source] = channel.site_id.split('#')

    return `https://raw.githubusercontent.com/matthuisman/i.mjh.nz/master/${source}.xml`
  },
  parser: function ({ content, channel, date, cached }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      programs.push({
        title: parseTitle(item, channel),
        description: parseDescription(item, channel),
        category: parseCategory(item, channel),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels({ path, lang = 'en' }) {
    const [service] = path.split('/')
    let data = await axios
      .get(`https://i.mjh.nz/${service}/app.json`)
      .then(r => r.data)
      .catch(console.log)

    const channels = []
    const items = data.channels || data
    for (let id in items) {
      const channel = items[id]
      channels.push({
        lang,
        site_id: `${path}#${id}`,
        name: channel.name
      })
    }

    return channels
  }
}

function parseTitle(item, channel) {
  return item.title.length ? item.title[0].value : null
}

function parseDescription(item, channel) {
  return item.desc.length ? item.desc[0].value : null
}

function parseCategory(item, channel) {
  const category = item.category.length ? item.category[0].value : ''

  return category.split(/\s\&amp\;\s/g).filter(c => c)
}

function parseStart(item) {
  return dayjs(item.start, 'YYYYMMDDHHmmss ZZ')
}

function parseStop(item) {
  return dayjs(item.stop, 'YYYYMMDDHHmmss ZZ')
}

function parseItems(content, channel, date) {
  try {
    const curr_day = date
    const next_day = date.add(1, 'd')
    const [_, site_id] = channel.site_id.split('#')
    const data = parser.parse(content)
    if (!data || !Array.isArray(data.programs)) return []

    return data.programs.filter(
      p =>
        p.channel === site_id && dayjs(p.start, 'YYYYMMDDHHmmss ZZ').isBetween(curr_day, next_day)
    )
  } catch (error) {
    return []
  }
}
