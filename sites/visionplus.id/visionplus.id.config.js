const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const languages = { en: 'ENG', id: 'IND' }

module.exports = {
  site: 'visionplus.id',
  days: 2,
  url({ date, channel }) {
    return `https://www.visionplus.id/managetv/tvinfo/events/schedule?language=${
      languages[channel.lang]
    }&serviceId=${channel.site_id}&start=${date.format('YYYY-MM-DD')}T00%3A00%3A00Z&end=${date
      .add(1, 'd')
      .format('YYYY-MM-DD')}T00%3A00%3A00Z&view=cd-events-grid-view`
  },
  parser({ content, channel }) {
    const programs = []
    const json = JSON.parse(content)
    if (Array.isArray(json.evs)) {
      for (const ev of json.evs) {
        if (ev.sid === channel.site_id) {
          const title = ev.con && ev.con.loc ? ev.con.loc[0].tit : ev.con.oti
          const [, , season, , episode] = title.match(/( S(\d+))?(, Ep (\d+))/) || [
            null,
            null,
            null,
            null,
            null
          ]
          programs.push({
            title,
            description: ev.con && ev.con.loc ? ev.con.loc[0].syn : null,
            categories: ev.con ? ev.con.categories : null,
            season: season ? parseInt(season) : season,
            episode: episode ? parseInt(episode) : episode,
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
    const axios = require('axios')
    const json = await axios
      .get(`https://www.visionplus.id/managetv/tvinfo/channels/get?language=${languages[lang]}`)
      .then(response => response.data)
      .catch(console.error)

    if (Array.isArray(json?.chs)) {
      for (const ch of json.chs) {
        result.push({
          lang,
          site_id: ch.sid,
          name: ch.loc[0].nam
        })
      }
    }

    return result
  }
}
