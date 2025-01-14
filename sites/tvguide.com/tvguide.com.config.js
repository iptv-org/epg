const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const doFetch = require('@ntlab/sfetch')
const debug = require('debug')('site:tvguide.com')

dayjs.extend(utc)
dayjs.extend(timezone)

doFetch.setDebugger(debug).setCheckResult(false)

const providerId = '9100001138'
const maxDuration = 240
const segments = 1440 / maxDuration

module.exports = {
  site: 'tvguide.com',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  async url({ date, segment = 1 }) {
    const params = []
    if (module.exports.apiKey === undefined) {
      module.exports.apiKey = await module.exports.fetchApiKey()
      debug('Got api key', module.exports.apiKey)
    }
    if (date) {
      if (segment > 1) {
        date = date.add((segment - 1) * maxDuration, 'm')
      }
      params.push(`start=${date.unix()}`, `duration=${maxDuration}`)
    }
    params.push(`apiKey=${module.exports.apiKey}`)

    return date ?
      `https://backend.tvguide.com/tvschedules/tvguide/${providerId}/web?${params.join('&')}` :
      `https://backend.tvguide.com/tvschedules/tvguide/serviceprovider/${providerId}/sources/web?${params.join('&')}`
  },
  async parser({ content, date, channel }) {
    const programs = []
    const f = data => {
      const result = []
      if (typeof data === 'string') {
        data = JSON.parse(data)
      }
      if (data && Array.isArray(data?.data?.items)) {
        data.data.items
          .filter(i => i.channel.sourceId.toString() === channel.site_id)
          .forEach(i => {
            result.push(...i.programSchedules.map(p => {
              return { i: p, url: p.programDetails }
            }))
          })
      }

      return result
    }
    const queues = f(content)
    if (queues.length) {
      const parts = []
      for (let i = 2; i <= segments; i++) {
        parts.push(await module.exports.url({ date, segment: i }))
      }
      await doFetch(parts, (url, res) => {
        queues.push(...f(res))
      })
      await doFetch(queues, (queue, res) => {
        const item = res?.data?.item ? res.data.item : queue.i 
        programs.push({
          title: item.title ? item.title : queue.i.title,
          sub_title: item.episodeNumber ? item.episodeTitle : null,
          description: item.description,
          season: item.seasonNumber,
          episode: item.episodeNumber,
          rating: item.rating ? { system: 'MPA', value: item.rating } : null,
          categories: Array.isArray(item.genres) ? item.genres.map(g => g.name) : null,
          start: dayjs.unix(item.startTime ? item.startTime : queue.i.startTime),
          stop: dayjs.unix(item.endTime ? item.endTime : queue.i.endTime)
        })
      })
    }

    return programs
  },
  async channels() {
    const channels = []
    const data = await axios
      .get(await this.url({}))
      .then(r => r.data)
      .catch(console.error)

    data.data.items.forEach(item => {
      channels.push({
        lang: 'en',
        site_id: item.sourceId,
        name: item.fullName.replace(/Channel|Schedule/g, '').trim()
      })
    })

    return channels
  },
  async fetchApiKey() {
    const data = await axios
      .get('https://www.tvguide.com/listings/')
      .then(r => r.data)
      .catch(console.error)

    return data ? data.match(/apiKey=([a-zA-Z0-9]+)&/)[1] : null
  }
}
