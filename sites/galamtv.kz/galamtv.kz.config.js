const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'galamtv.kz',
  timezone: 'Asia/Almaty',
  days: 2,
  request: {
    method: 'GET',
    headers: {
      Referer: 'https://galamtv.kz/',
      Origin: 'https://galamtv.kz',
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br, zstd'
    }
  },
  url({ channel, date }) {
    const todayEpoch = date.startOf('day').unix()
    const nextDayEpoch = date.add(1, 'day').startOf('day').unix()
    return `https://galam.server-api.lfstrm.tv/channels/${channel.site_id}/programs?period=${todayEpoch}:${nextDayEpoch}`
  },
  parser: function ({ content }) {
    let programs = []
    const data = JSON.parse(content)
    const programsData = data.programs || []

    programsData.forEach(program => {
      const start = dayjs.unix(program.scheduleInfo.start)
      const stop = dayjs.unix(program.scheduleInfo.end)

      programs.push({
        title: program.metaInfo.title,
        description: program.metaInfo.description,
        image: program.mediaInfo.thumbnails[0].url,
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    try {
      const response = await axios.get('https://galam.server-api.lfstrm.tv/channels-now')
      return response.data.channels.map(item => {
        return {
          lang: 'kk',
          site_id: item.channels.id,
          name: item.channels.info.metaInfo.title
        }
      })
    } catch (error) {
      console.error('Error fetching channels:', error)
      return []
    }
  }
}
