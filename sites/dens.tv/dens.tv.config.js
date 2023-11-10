const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'dens.tv',
  days: 2,
  url: function ({ channel, date }) {
    return `https://www.dens.tv/tvpage_octo/epgchannel2/${date.format('YYYY-MM-DD')}/${channel.site_id}`
  },
  parser: function ({ content }) {
    // parsing
    const response = JSON.parse(content)
    const programs = []

    if(response.response !== undefined && response.response === 0 && response.data !== undefined && Array.isArray(response.data)){
      response.data.forEach(item => {
        programs.push({
          title: item.title,
          start: dayjs.tz(item.starttime, 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta'),
          stop: dayjs.tz(item.endtime, 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta'),
        })
      })
    }

    return programs
  }
}
