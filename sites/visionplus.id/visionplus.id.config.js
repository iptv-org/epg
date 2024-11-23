const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const cheerio = require('cheerio')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const languages = { en: 'ENG', id: 'IND' }
const tz = 'Asia/Jakarta'

module.exports = {
  site: 'visionplus.id',
  days: 2,
  url({ date, channel }) {
    return `https://www.visionplus.id/managetv/tvinfo/events/schedule?language=${languages[channel.lang]}&serviceId=${channel.site_id}&start=${date.format(
      'YYYY-MM-DD'
    )}T00%3A00%3A00Z&end=${date.add(1, 'd').format(
      'YYYY-MM-DD'
    )}T00%3A00%3A00Z&view=cd-events-grid-view`
  },
  parser({ content, channel, date }) {
    const programs = []
    const json = JSON.parse(content)
    if (Array.isArray(json.evs)) {
      for (const ev of json.evs) {
        if (ev.sid === channel.site_id) {
          programs.push({
            title: ev.con && ev.con.loc ? ev.con.loc[0].tit : ev.con.oti,
            description: ev.con && ev.con.loc ? ev.con.loc[0].syn : null,
            categories: ev.con ? ev.con.categories : null,
            start: dayjs(ev.sta),
            stop: dayjs(ev.end)
          })
        }
      }
    }

    return programs
  },
  async channels({ lang = 'id' }) {
    const result = []
    const fs = require('fs')
    const path = require('path')
    const channelFile = path.join(__dirname, 'channels.json')
    if (fs.existsSync(channelFile)) {
      const items = JSON.parse(fs.readFileSync(channelFile))
      Object.values(items).forEach(item => {
        result.push({
          lang,
          site_id: item.serviceId,
          name: item.name
        })
      })
    }

    return result
  }
}
