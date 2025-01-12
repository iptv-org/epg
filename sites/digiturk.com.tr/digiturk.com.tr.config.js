const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const tz = 'Europe/Istanbul'

module.exports = {
  site: 'digiturk.com.tr',
  days: 2,
  url({ date }) {
    return `https://www.digiturk.com.tr/Ajax/GetTvGuideFromDigiturk?Day=${
      encodeURIComponent(date.format('MM/DD/YYYY'))
    }+00%3A00%3A00`
  },
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  parser({ content, channel, date }) {
    const programs = []
    if (content) {
      const $ = cheerio.load(content)
      $('.channelDetail').toArray()
        .forEach(item => {
          const $item = $(item)
          const title = $item.find('.tvGuideResult-box-wholeDates-title')
          if (title.length) {
            const channelId = title.attr('onclick')
            if (channelId) {
              const site_id = channelId.match(/\s(\d+)\)/)[1]
              if (channel.site_id === site_id) {
                const startTime = $item.find('.tvGuideResult-box-wholeDates-time-hour').text().trim()
                const duration = $item.find('.tvGuideResult-box-wholeDates-time-totalMinute')
                  .text().trim().match(/\d+/)[0]
                const start = dayjs.tz(`${date.format('YYYY-MM-DD')} ${startTime}`, 'YYYY-MM-DD HH:mm', tz)
                const stop = start.add(parseInt(duration), 'm')
                programs.push({
                  title: title.text().trim(),
                  start,
                  stop
                })
              }
            }
          }
        })
    }

    return programs
  },
  async channels() {
    const channels = {}
    const axios = require('axios')
    const data = await axios
      .get(this.url({ date: dayjs() }))
      .then(r => r.data)
      .catch(console.error)

    const $ = cheerio.load(data)
    $('.channelContent').toArray()
      .forEach(el => {
        const item = $(el)
        const channelId = item.find('.channelDetail .tvGuideResult-box-wholeDates-title')
          .first()
          .attr('onclick')
        if (channelId) {
          const site_id = channelId.match(/\s(\d+)\)/)[1]
          if (channels[site_id] === undefined) {
            channels[site_id] = {
              lang: 'tr',
              site_id,
              name: item.find('#channelID').val()
            }
          }
        }
      })

    return Object.values(channels)
  }
}
