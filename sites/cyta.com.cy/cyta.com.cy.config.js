const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'cyta.com.cy',
  days: 7,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url: function ({ date, channel }) {
    // Get the epoch timestamp
    const todayEpoch = date.startOf('day').utc().valueOf()
    // Get the epoch timestamp for the next day
    const nextDayEpoch = date.add(1, 'day').startOf('day').utc().valueOf()
    return `https://epg.cyta.com.cy/api/mediacatalog/fetchEpg?startTimeEpoch=${todayEpoch}&endTimeEpoch=${nextDayEpoch}&language=1&channelIds=${channel.site_id}`
  },
  parser: function ({ content }) {
    const data = JSON.parse(content)
    const programs = []

    data.channelEpgs.forEach(channel => {
      channel.epgPlayables.forEach(epg => {
        const start = new Date(epg.startTime).toISOString()
        const stop = new Date(epg.endTime).toISOString()

        programs.push({
          title: epg.name,
          start,
          stop
        })
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const data = await axios
      .get('https://epg.cyta.com.cy/api/mediacatalog/fetchChannels?language=1')
      .then(r => r.data)
      .catch(console.log)

    return data.channels.map(item => {
      return {
        lang: 'el',
        site_id: item.id,
        name: item.name
      }
    })
  }
}
