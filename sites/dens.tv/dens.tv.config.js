const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const tz = 'Asia/Jakarta'

module.exports = {
  site: 'dens.tv',
  days: 2,
  url({ channel, date }) {
    return `https://www.dens.tv/api/dens3/tv/TvChannels/listEpgByDate?date=${date.format(
      'YYYY-MM-DD'
    )}&id_channel=${channel.site_id}&app_type=10`
  },
  parser({ content }) {
    // parsing
    const response = JSON.parse(content)
    const programs = []

    if (Array.isArray(response?.data)) {
      response.data.forEach(item => {
        const title = item.title
        const [, , , season, , , episode] = title.match(
          /( (Season |Season|S)(\d+))?( (Episode|Ep) (\d+))/
        ) || [null, null, null, null, null, null, null]
        programs.push({
          title,
          description: item.description,
          season: season ? parseInt(season) : season,
          episode: episode ? parseInt(episode) : episode,
          start: dayjs.tz(item.start_time, 'YYYY-MM-DD HH:mm:ss', tz),
          stop: dayjs.tz(item.end_time, 'YYYY-MM-DD HH:mm:ss', tz)
        })
      })
    }

    return programs
  },
  async channels() {
    const axios = require('axios')

    const categories = {
      local: 1,
      premium: 2,
      international: 3
    }

    const channels = []
    for (const id_category of Object.values(categories)) {
      const data = await axios
        .get('https://www.dens.tv/api/dens3/tv/TvChannels/listByCategory', {
          params: { id_category }
        })
        .then(r => r.data)
        .catch(console.error)

      data.data.contents.forEach(item => {
        channels.push({
          lang: 'id',
          site_id: item.meta.id,
          name: item.meta.title
        })
      })
    }

    return channels
  }
}
