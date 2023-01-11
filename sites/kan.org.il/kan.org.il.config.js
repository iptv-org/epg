const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  skip: true, // INFO: Request failed with status code 403 (Access denied)
  site: 'kan.org.il',
  days: 2,
  url: function ({ channel, date }) {
    return `https://www.kan.org.il/tv-guide/tv_guidePrograms.ashx?stationID=${
      channel.site_id
    }&day=${date.format('DD/MM/YYYY')}`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.live_desc,
        icon: item.picture_code,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  }
}

function parseStart(item) {
  if (!item.start_time) return null

  return dayjs.tz(item.start_time, 'YYYY-MM-DDTHH:mm:ss', 'Asia/Jerusalem')
}

function parseStop(item) {
  if (!item.end_time) return null

  return dayjs.tz(item.end_time, 'YYYY-MM-DDTHH:mm:ss', 'Asia/Jerusalem')
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!Array.isArray(data)) return []

  return data
}
