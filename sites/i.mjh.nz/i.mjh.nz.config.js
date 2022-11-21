const dayjs = require('dayjs')
const axios = require('axios')
const parser = require('epg-parser')
const isBetween = require('dayjs/plugin/isBetween')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(isBetween)
dayjs.extend(customParseFormat)

const API_ENDPOINT = 'https://raw.githubusercontent.com/matthuisman/i.mjh.nz/master'

module.exports = {
  site: 'i.mjh.nz',
  request: {
    cache: {
      ttl: 3 * 60 * 60 * 1000 // 3h
    },
    maxContentLength: 30 * 1024 * 1024 // 30Mb
  },
  url: function ({ channel }) {
    const [path] = channel.site_id.split('#')

    return `${API_ENDPOINT}/${path}.xml`
  },
  parser: function ({ content, channel, date, cached }) {
    const items = parseItems(content, channel, date)

    return items.map(item => {
      return {
        ...item,
        title: getTitle(item),
        description: getDescription(item),
        categories: getCategories(item)
      }
    })
  },
  async channels({ path, lang = 'en' }) {
    let xml = await axios
      .get(`${API_ENDPOINT}/${path}.xml`)
      .then(r => r.data)
      .catch(console.log)
    let data = parser.parse(xml)

    return data.channels.map(channel => {
      return {
        lang,
        site_id: `${path}#${channel.id}`,
        name: channel.name[0].value
      }
    })
  }
}

function getTitle(item) {
  return item.title.length ? item.title[0].value : null
}

function getDescription(item) {
  return item.desc.length ? item.desc[0].value : null
}

function getCategories(item) {
  return item.category.map(c => c.value)
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
