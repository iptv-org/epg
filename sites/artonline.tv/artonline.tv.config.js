process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
const dayjs = require('dayjs')

dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(utc)

module.exports = {
  site: 'artonline.tv',
  days: 2,
  url: function ({ channel }) {
    const [, site_id] = channel.site_id.split('#')

    return `https://www.artonline.tv/Home/Tvlist${site_id}`
  },
  request: {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    data: function ({ date }) {
      const diff = date.diff(dayjs.utc().startOf('d'), 'd')
      const params = new URLSearchParams()
      params.append('objId', diff)

      return params
    }
  },
  parser: function ({ content }) {
    const programs = []
    if (!content) return programs
    const items = JSON.parse(content)
    items.forEach(item => {
      const image = parseImage(item)
      const start = parseStart(item)
      const duration = parseDuration(item)
      const stop = start.add(duration, 's')
      programs.push({
        title: item.title,
        description: item.description,
        image,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item) {
  const [, M, D, YYYY] = item.adddate.match(/(\d+)\/(\d+)\/(\d+) /)
  const [HH, mm] = item.start_Time.split(':')

  return dayjs.tz(`${YYYY}-${M}-${D}T${HH}:${mm}:00`, 'YYYY-M-DTHH:mm:ss', 'Asia/Riyadh')
}

function parseDuration(item) {
  const [, HH, mm, ss] = item.duration.match(/(\d+):(\d+):(\d+)/)

  return parseInt(HH) * 3600 + parseInt(mm) * 60 + parseInt(ss)
}

function parseImage(item) {
  return item.thumbnail ? `https://www.artonline.tv${item.thumbnail}` : null
}
