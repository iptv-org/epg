const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const duration = require('dayjs/plugin/duration')
const doFetch = require('@ntlab/sfetch')
const debug = require('debug')('site:dsmart.com.tr')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(duration)

doFetch.setDebugger(debug)

const channelsWithSchedule = true
const pageLimit = 10
const caches = {}

module.exports = {
  site: 'dsmart.com.tr',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  url({ date, page = 1 }) {
    return `https://www.dsmart.com.tr/api/v1/public/epg/schedules?page=${
      page
    }&limit=${
      pageLimit
    }&day=${
      date.format('YYYY-MM-DD')
    }`
  },
  async parser({ content, channel, date, useCache = true }) {
    const programs = []
    if (content) {
      if (typeof content === 'string') {
        content = JSON.parse(content)
      }
      if (useCache) {
        const cacheKey = date.format('YYYYMMDD')
        // cache whole channels for the day
        if (caches[cacheKey] === undefined) {
          if (content?.data?.total) {
            const queues = []
            const pages = Math.ceil(content.data.total / pageLimit)
            for (let page = 2; page <= pages; page++) {
              queues.push(module.exports.url({ date, page }))
            }
            await doFetch(queues, (url, res) => {
              if (Array.isArray(res?.data?.channels)) {
                content.data.channels.push(...res.data.channels)
              }
            })
            caches[cacheKey] = content
          }
        } else {
          content = caches[cacheKey]
        }
      }
      if (Array.isArray(content?.data?.channels)) {
        content.data.channels
          .filter(i => i._id === channel.site_id)
          .forEach(i => {
            if (i.schedule.length) {
              let dayStart, ofs
              programs.push(...i.schedule
                .map(p => {
                  const baseDate = dayjs.utc(p.day)
                  const startDate = dayjs.utc(p.start_date)
                  // calculate base offset if needed
                  if (!dayStart) {
                    dayStart = startDate
                    ofs = dayjs.duration(dayjs.utc(`${p.day.substr(0, 11)}${p.start_date.substr(11)}`).diff(baseDate))
                      .asSeconds()
                  }
                  const delta = dayjs.duration(startDate.diff(dayStart)).asSeconds()
                  // ignore days in duration
                  const [h, m, s] = (p.duration.includes(',') ? p.duration.split(',')[1].trim() : p.duration)
                    .split(':').map(Number)
                  const duration = (h * 3600) + (m * 60) + s
                  const start = baseDate.add(ofs + delta, 's')
                  const stop = start.add(duration, 's')
                  return {
                    title: p.program_name,
                    description: p.description,
                    category: p.genre && p.genre.includes('/') ?
                      p.genre.split('/').map(g => `${g.substr(0, 1).toUpperCase()}${g.substr(1)}`) : null,
                    start,
                    stop
                  }
                })
              )
            }
          })
      }
    }

    return programs
  },
  async channels() {
    const channels = []
    const f = page => this.url({ date: dayjs(), page })
    let pages, page = 1
    const queues = [f(page)]
    await doFetch(queues, (url, res) => {
      if (!pages && res.data.total) {
        pages = Math.ceil(res.data.total / pageLimit)
        while (page < pages) {
          queues.push(f(++page))
        }
      }
      if (Array.isArray(res?.data?.channels)) {
        channels.push(...res.data.channels
          .filter(i => (channelsWithSchedule && i.schedule.length) || !channelsWithSchedule)
          .map(i => {
            return {
              lang: 'tr',
              name: i.channel_name,
              site_id: i._id
            }
          })
        )
      }
    })

    return channels
  }
}
