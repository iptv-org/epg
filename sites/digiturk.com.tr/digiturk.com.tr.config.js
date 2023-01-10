const _ = require('lodash')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'digiturk.com.tr',
  days: 2,
  url: function ({ date, channel }) {
    return `https://www.digiturk.com.tr/yayin-akisi/api/program/kanal/${
      channel.site_id
    }/${date.format('YYYY-MM-DD')}/0`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = start.add(item.BroadcastDuration, 's')
      programs.push({
        title: item.ProgramName,
        description: item.LongDescription,
        category: parseCategory(item),
        start,
        stop
      })
    })

    programs = _.sortBy(programs, 'start')

    return programs
  }
}

function parseStart(item) {
  return dayjs.tz(item.BroadcastStart, 'Europe/Istanbul')
}

function parseCategory(item) {
  const categories = {
    '00': 'Diğer',
    E0: 'Romantik Komedi',
    E1: 'Aksiyon',
    E4: 'Macera',
    E5: 'Dram',
    E6: 'Fantastik',
    E7: 'Komedi',
    E8: 'Korku',
    EB: 'Polisiye',
    EF: 'Western',
    FA: 'Macera',
    FB: 'Yarışma',
    FC: 'Eğlence',
    F0: 'Reality-Show',
    F2: 'Haberler',
    F4: 'Belgesel',
    F6: 'Eğitim',
    F7: 'Sanat ve Kültür',
    F9: 'Life Style'
  }

  return categories[item.Genre]
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  const items = data.listings[channel.site_id]
  if (!Array.isArray(items)) return []

  return items
}
