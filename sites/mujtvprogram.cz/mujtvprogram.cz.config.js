const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const convert = require('xml-js')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'mujtvprogram.cz',
  days: 2,
  url({ channel, date }) {
    const diff = date.diff(dayjs.utc().startOf('d'), 'd')
    return `https://services.mujtvprogram.cz/tvprogram2services/services/tvprogrammelist_mobile.php?channel_cid=${channel.site_id}&day=${diff}`
  },
  parser({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.name._text,
        start: parseTime(item.startDate._text),
        stop: parseTime(item.endDate._text),
        description: parseDescription(item),
        category: parseCategory(item),
        date: item.year._text || null,
        director: parseList(item.directors),
        actor: parseList(item.actors)
      })
    })
    return programs
  },
  async channels() {
    const cheerio = require('cheerio')
    const axios = require('axios')

    let channels = []

    const categories = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    for (let category of categories) {
      const params = new URLSearchParams()
      params.append('localization', 1)
      params.append('list_for_selector', 1)
      params.append('category_kid', category)

      const data = await axios
        .post(
          'https://services.mujtvprogram.cz/tvprogram2services/services/tvchannellist_mobile.php',
          params,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        )
        .then(r => r.data)
        .catch(console.log)

      const $ = cheerio.load(data, { xmlMode: true })

      $('channel').each((i, el) => {
        let lang = $(el).find('lang').text()
        if (lang === 'cz') lang = 'cs'

        channels.push({
          lang,
          site_id: $(el).find('cid').text(),
          name: $(el).find('name').first().text()
        })
      })
    }

    return channels
  }
}

function parseItems(content) {
  try {
    const data = convert.xml2js(content, {
      compact: true,
      ignoreDeclaration: true,
      ignoreAttributes: true
    })
    if (!data) return []
    const programmes = data['tv-program-programmes'].programme
    return programmes && Array.isArray(programmes) ? programmes : []
  } catch {
    return []
  }
}
function parseDescription(item) {
  if (item.longDescription) return item.longDescription._text
  if (item.shortDescription) return item.shortDescription._text
  return null
}

function parseList(list) {
  if (!list) return []
  if (!list._text) return []
  return typeof list._text === 'string' ? list._text.split(', ') : []
}
function parseTime(time) {
  return dayjs.tz(time, 'DD.MM.YYYY HH.mm', 'Europe/Prague')
}

function parseCategory(item) {
  if (!item['programme-type']) return null
  return item['programme-type'].name._text
}
