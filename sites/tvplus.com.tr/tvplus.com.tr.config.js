const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tvplus.com.tr',
  days: 2,
  url: 'https://izmottvsc23.tvplus.com.tr:33207/EPG/JSON/PlayBillList',
  request: {
    method: 'POST',
    async headers() {
      const response = await axios
        .post('https://izmottvsc23.tvplus.com.tr:33207/EPG/JSON/Authenticate', {
          terminaltype: 'WEBTV_WIDEVINE',
          userType: '3',
          timezone: 'UTC'
        })
        .catch(console.log)
      const cookie = Array.isArray(response.headers['set-cookie'])
        ? response.headers['set-cookie'].join('; ')
        : ''

      return { cookie }
    },
    data({ date, channel }) {
      return {
        type: '2',
        channelid: channel.site_id,
        begintime: date.format('YYYYMMDDHHmmss'),
        endtime: date.add(1, 'd').format('YYYYMMDDHHmmss')
      }
    }
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = parseStop(item)
      programs.push({
        title: item.name,
        category: item.genres,
        description: item.introduce,
        icon: parseIcon(item),
        start: start.toJSON(),
        stop: stop.toJSON()
      })
    })

    return programs
  }
}

function parseIcon(item) {
  return item.pictures && item.pictures.length ? item.pictures[0].href : null
}

function parseStart(item) {
  return dayjs.utc(item.starttime, 'YYYYMMDDHHmmss')
}

function parseStop(item) {
  return dayjs.utc(item.endtime, 'YYYYMMDDHHmmss')
}

function parseItems(content) {
  const data = JSON.parse(content)

  return data.playbilllist || []
}
