const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'ntv.co.jp',
  days: 7,
  url: 'https://www.ntv.co.jp/program/json/program_list.json',
  request: {
    cache: {
      ttl: 60 * 60 * 1000
    }
  },
  parser({ buffer, date }) {
    const items = parseItems(buffer, date)

    return items.map(item => {
      return {
        title: item.program_title,
        description: item.program_detail,
        actors: Array.isArray(item.performers) ? item.performers.map(p => p.performer) : [],
        start: dayjs.tz(
          item.actual_datetime.broadcast_date + item.actual_datetime.start_time,
          'YYYYMMDDHHmm',
          'Asia/Tokyo'
        ),
        stop: dayjs.tz(
          item.actual_datetime.broadcast_date + item.actual_datetime.end_time,
          'YYYYMMDDHHmm',
          'Asia/Tokyo'
        )
      }
    })
  },
  channels() {
    return [
      {
        name: 'Nippon TV',
        xmltv_id: 'JOAXDTV.jp',
        site_id: '#',
        lang: 'ja'
      }
    ]
  }
}

function parseItems(buffer, date) {
  try {
    const cleanJsonText = String(buffer)
      .replace(/^\uFEFF/, '')
      .trim()
    const data = JSON.parse(cleanJsonText)
    if (!data) return []

    const requestedDate = date.format('YYYYMMDD')
    const items = data.filter(item => item.actual_datetime.broadcast_date === requestedDate)

    return items
  } catch {
    return []
  }
}
