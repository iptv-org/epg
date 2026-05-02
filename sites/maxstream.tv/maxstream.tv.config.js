const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const tz = 'Asia/Jakarta'

module.exports = {
  site: 'maxstream.tv',
  days: 2,
  url({ channel }) {
    return `https://vmp.maxstream.tv/api/v3/videos/${channel.site_id}/schedules`
  },
  parser({ content, channel, date }) {
    const programs = []
    if (content && typeof content === 'string') {
      content = JSON.parse(content)
    }
    if (Array.isArray(content?.data)) {
      const schedules = []
      content.data.forEach(item => {
        schedules.push(...item.metadata)
      })
      const f = dt => dayjs.tz(dt, tz).isSame(date, 'day')
      schedules
        .filter(entry => entry.parentId === channel.site_id && (f(entry.startTime) || f(entry.endTime)))
        .forEach(entry => {
          const [, , , season, , , session2, , , episode] = entry.tvProgram.match(
            /((\s(\d+)[a-zA-Z]{2})?\s(Season(\s)?||S)(\d+)?)?(\s-\sEps\.(\s)?(\d+))/
          ) || [null, null, null, null, null, null, null, null, null, null]
          programs.push({
            title: entry.tvProgram,
            description: entry.description,
            start: dayjs.tz(entry.startTime, tz),
            stop: dayjs.tz(entry.endTime, tz),
            season: season || session2 ? parseInt(season || session2) : null,
            episode: episode ? parseInt(episode) : null,
            image: entry.thumbnail_url
          })
        })
    }

    return programs
  },
  async channels() {
    const channels = []
    const data = await axios
      .get('https://vmp.maxstream.tv/api/v3/videos/list?contentType=channel')
      .then(response => response.data)
      .catch(console.error)

    if (Array.isArray(data?.videos)) {
      channels.push(...data.videos
        .filter(item => item?.contentType === 'Channel')
        .map(item => ({
          lang: 'id',
          site_id: item.id,
          name: item.translations.id.title
        })))
    }

    return channels
  }
}
