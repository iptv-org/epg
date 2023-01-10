const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'mako.co.il',
  days: 2,
  url: 'https://www.mako.co.il/AjaxPage?jspName=EPGResponse.jsp',
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = start.add(item.DurationMs, 'ms')
      programs.push({
        title: item.ProgramName,
        description: item.EventDescription,
        icon: item.Picture,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item) {
  if (!item.StartTimeUTC) return null

  return dayjs(item.StartTimeUTC)
}

function parseStop(item) {
  if (!item.end_time) return null

  return dayjs.tz(item.end_time, 'YYYY-MM-DDTHH:mm:ss', 'Asia/Jerusalem')
}

function parseItems(content, date) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.programs)) return []
  const d = date.format('DD/MM/YYYY')

  return data.programs.filter(item => item.Date.startsWith(d))
}
