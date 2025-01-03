const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const tz = 'Asia/Hong_Kong'

module.exports = {
  site: 'programme.tvb.com',
  days: 2,
  url({ channel, date, time = null }) {
    return `https://programme.tvb.com/api/schedule?input_date=${date.format(
      'YYYYMMDD'
    )}&network_code=${channel.site_id}&_t=${time ? time : parseInt(Date.now() / 1000)}`
  },
  parser({ content, channel, date }) {
    const programs = []
    const data = content ? JSON.parse(content) : {}
    if (Array.isArray(data.data?.list)) {
      for (const d of data.data.list) {
        if (Array.isArray(d.schedules)) {
          const schedules = d.schedules.filter(s => s.network_code === channel.site_id)
          schedules.forEach((s, i) => {
            const start = dayjs.tz(s.event_datetime, 'YYYY-MM-DD HH:mm:ss', tz)
            let stop
            if (i < schedules.length - 1) {
              stop = dayjs.tz(schedules[i + 1].event_datetime, 'YYYY-MM-DD HH:mm:ss', tz)
            } else {
              stop = date.add(1, 'd')
            }
            programs.push({
              title: channel.lang === 'en' ? s.en_programme_title : s.programme_title,
              description: channel.lang === 'en' ? s.en_synopsis : s.synopsis,
              start,
              stop
            })
          })
        }
      }
    }

    return programs
  },
  async channels({ lang = 'en' }) {
    const channels = []
    const axios = require('axios')
    const base = 'https://programme.tvb.com'
    const queues = [base]
    while (true) {
      if (queues.length) {
        const url = queues.shift()
        const content = await axios
          .get(url)
          .then(response => response.data)
          .catch(console.error)
        if (content) {
          const assets = content.match(/assets\/index\.([a-z0-9]+)\.js/g)
          if (assets) {
            queues.push(...assets.map(a => base + '/' + a))
          } else {
            const metadata = content.match(/e=(\[(.*?)\])/)
            if (metadata) {
              const infos = eval(metadata[1])
              if (Array.isArray(infos)) {
                infos
                  .filter(a => a.code.length)
                  .map(a => {
                    channels.push({
                      lang,
                      site_id: a.code,
                      name: lang === 'en' ? a.nameEn : a.name
                    })
                  })
                break
              }
            }
          }
          if (queues.length) {
            continue
          }
        }
      }
      break
    }

    return channels
  }
}
