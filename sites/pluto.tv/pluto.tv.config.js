const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'pluto.tv',
  days: 3,

  url: function ({ date, channel }) {
    const channelId = channel.site_id

    const localTimezone = dayjs.tz.guess()

    const startTime = dayjs(date).tz(localTimezone).startOf('day').toISOString()
    const endTime = dayjs(date).tz(localTimezone).add(this.days, 'day').endOf('day').toISOString()

    const generatedUrl = `https://api.pluto.tv/v2/channels/${channelId}?start=${startTime}&stop=${endTime}`
    return generatedUrl
  },

  parser: function ({ content }) {
    const data = JSON.parse(content)
    const programs = []

    if (data.timelines) {
      data.timelines.forEach(item => {
        programs.push({
          title: item.title,
          subTitle: item.episode?.name || '',
          description: item.episode?.description || '',
          episode: item.episode?.number || '',
          season: item.episode?.season || '',
          actors: item.episode?.clip?.actors || [],
          categories: [item.episode?.genre, item.episode?.subGenre].filter(Boolean),
          rating: item.episode?.rating || '',
          date: item.episode?.clip?.originalReleaseDate || '',
          icon: item.episode?.series?.tile?.path || '',
          start: item.start,
          stop: item.stop
        })
      })
    }

    return programs
  }
}
