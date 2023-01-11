const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
var customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'movistarplus.es',
  days: 2,
  url: function ({ date }) {
    return `https://www.movistarplus.es/programacion-tv/${date.format('YYYY-MM-DD')}?v=json`
  },
  parser({ content, channel, date }) {
    let programs = []
    let items = parseItems(content, channel)
    if (!items.length) return programs
    let guideDate = date
    items.forEach(item => {
      let startTime = dayjs.tz(
        `${guideDate.format('YYYY-MM-DD')} ${item.HORA_INICIO}`,
        'YYYY-MM-DD HH:mm',
        'Europe/Madrid'
      )
      let stopTime = dayjs.tz(
        `${guideDate.format('YYYY-MM-DD')} ${item.HORA_FIN}`,
        'YYYY-MM-DD HH:mm',
        'Europe/Madrid'
      )
      if (stopTime.isBefore(startTime)) {
        guideDate = guideDate.add(1, 'd')
        stopTime = stopTime.add(1, 'd')
      }
      programs.push({
        title: item.TITULO,
        category: item.GENERO,
        start: startTime.toJSON(),
        stop: stopTime.toJSON()
      })
    })
    return programs
  }
}

function parseItems(content, channel) {
  const json = typeof content === 'string' ? JSON.parse(content) : content
  if (!(`${channel.site_id}-CODE` in json.data)) return []
  const data = json.data[`${channel.site_id}-CODE`]
  return data ? data.PROGRAMAS : []
}
