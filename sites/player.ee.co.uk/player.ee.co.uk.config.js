const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'player.ee.co.uk',
  days: 2,
  url({ date, channel, hour = 0 }) {
    return `https://api.youview.tv/metadata/linear/v2/schedule/by-servicelocator?serviceLocator=${encodeURIComponent(
      channel.site_id
    )}&interval=${date.format('YYYY-MM-DD')}T${hour.toString().padStart(2, '0')}Z/PT12H`
  },
  request: {
    headers: {
      Referer: 'https://player.ee.co.uk/'
    }
  },
  async parser({ content, channel, date }) {
    const programs = []
    if (content) {
      const schedule = JSON.parse(content)
      // fetch next 12 hours schedule
      const { url, request } = module.exports
      const nextSchedule = await axios
        .get(url({ channel, date, hour: 12 }), { headers: request.headers })
        .then(response => response.data)
        .catch(console.error)

      if (schedule?.items) {
        // merge schedules
        if (nextSchedule?.items) {
          schedule.items.push(...nextSchedule.items)
        }
        schedule.items.forEach(item => {
          let season, episode
          const start = dayjs.utc(item.publishedStartTime)
          const stop = start.add(item.publishedDuration, 's')
          const description = item.synopsis
          if (description) {
            const matches = description.trim().match(/\(?S(\d+)[/\s]Ep(\d+)\)?/)
            if (matches) {
              if (matches[1]) {
                season = parseInt(matches[1])
              }
              if (matches[2]) {
                episode = parseInt(matches[2])
              }
            }
          }
          programs.push({
            title: item.title,
            description,
            season,
            episode,
            start,
            stop
          })
        })
      }
    }

    return programs
  },
  async channels() {
    const token =
      'eJx0kF1r2zAUhv_L6a0VfbRuF98lbTCB0ha7LYwRgiydZgLZMkdSMjP234e7bmMrvRFCOs_LeZ_vYAh1QnujE0IFSqhLJi6YElCAddGEI9L0FJFqCnmMUH2B1e3tU7tpWihAew8FfE1prDgnfLE66cUU8tHhaWFCz_sRD1cm8s8hPzs8rcbRO6OTC8OD1xPSdcuVUJKJJZPiTA-WgrN7ykNyPbKRwovzKKGApA9Vl-bMQgn5iYkrJmWVI9JhXuysXjesS_shnB6f9332yRkd0_-gkkwKpsr3IGYKcQyUYFcAfjM-W7Qt0tEZ3NrX3styqS4vSjlPEB5cGH7raDb19v5uFlKvm18n29zVf2_Mh8GG4c3YroAYMplZOO8mdgxGd9lrmlhC6iMUEHMXMUEF54tyIflHYvi6uV_dXK_ax_32gb9V6Sho2-nB_sl53ZNzDgXwf5H55cPw-fd8Uc7g7sfPAAAA__-Un7J1'
    const extensions = [
      'LinearCategoriesExtension',
      'LogicalChannelNumberExtension',
      'BTSubscriptionCodesExtension'
    ]
    const result = await axios
      .get('https://api.youview.tv/metadata/linear/v2/linear-services', {
        params: {
          contentTargetingToken: token,
          extensions: extensions.join(',')
        },
        headers: module.exports.request.headers
      })
      .then(response => response.data)
      .catch(console.error)

    return (
      result?.items
        .filter(channel => channel.mediaType === 'audio_and_video')
        .map(channel => {
          return {
            lang: 'en',
            site_id: channel.serviceLocator,
            name: channel.fullName
          }
        }) || []
    )
  }
}
