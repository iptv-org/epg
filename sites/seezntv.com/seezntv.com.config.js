const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'seezntv.com',
  skip: true, // NOTE: the site was closed on December 31, 2022
  days: 2,
  url: function ({ channel }) {
    return `https://api.seezntv.com/svc/menu/app6/api/epg_proglist?ch_no=${channel.site_id}&search_day=1`
  },
  request: {
    headers: {
      'X-DEVICE-TYPE': 'PCWEB',
      'X-DEVICE-MODEL': 'Chrome',
      'X-OS-TYPE': 'Windows',
      'X-OS-VERSION': '11',
      transactionId: '0'
    }
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const start = parseStart(item)
      let stop = parseStop(item)
      if (stop.isBefore(start)) {
        stop = stop.add(1, 'd')
      }

      programs.push({
        title: parseTitle(item),
        start,
        stop
      })
    })

    return programs
  },
  async channels({ country }) {
    const channels = []

    const data = await axios
      .get(`https://api.seezntv.com/svc/menu/app6/api/epg_chlist?category_id=1`, {
        headers: {
          'X-DEVICE-TYPE': 'PCWEB',
          transactionId: '0'
        }
      })
      .then(r => r.data.data.list[0])
      .catch(console.log)

    data.list_channel.forEach(i => {
      channels.push({
        name: i.service_ch_name,
        site_id: i.ch_no,
        lang: 'ko'
      })
    })

    return channels
  }
}

function parseTitle(item) {
  const name = item.program_name.replace(/\+/g, ' ')

  return decodeURIComponent(name)
}

function parseStart(item) {
  return dayjs.tz(`${item.start_ymd} ${item.start_time}`, 'YYYYMMDD HH:mm', 'Asia/Seoul')
}

function parseStop(item) {
  return dayjs.tz(`${item.start_ymd} ${item.end_time}`, 'YYYYMMDD HH:mm', 'Asia/Seoul')
}

function parseItems(content, date) {
  const data = JSON.parse(content)
  if (!data || !data.data || !Array.isArray(data.data.list)) return []
  const d = date.format('YYYYMMDD')

  return data.data.list.filter(i => i.start_ymd === d)
}
