const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'gigatv.3bbtv.co.th',
  days: 1,
  url({ channel }) {
    return `https://gigatv.3bbtv.co.th/wp-content/themes/changwattana/epg/${channel.site_id}.json`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      programs.push({
        title: item.programName,
        start: parseTime(item.startTime),
        stop: parseTime(item.endTime)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get('https://gigatv.3bbtv.co.th/wp-content/themes/changwattana/epg/channel.json')
      .then(r => r.data)
      .catch(console.log)

    const channels = []
    data.forEach(group => {
      group.channel_list.forEach(channel => {
        channels.push({
          lang: 'th',
          site_id: channel.channel_id,
          name: channel.channel_name
        })
      })
    })

    return channels
  }
}

function parseTime(string) {
  return dayjs.tz(string, 'YYYY-MM-DD HH:mm:ss', 'Asia/Bangkok')
}

function parseItems(content, date) {
  try {
    let data = JSON.parse(content)
    if (!Array.isArray(data)) return []
    data = data.filter(p => date.isSame(parseTime(p.startTime), 'day'))

    return data
  } catch {
    return []
  }
}
