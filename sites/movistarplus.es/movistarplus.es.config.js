const dayjs = require('dayjs')
var customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

module.exports = {
  site: 'movistarplus.es',
  ignore: true, // removes the site from the list until the test is passed
  url: function ({ date }) {
    return `https://www.movistarplus.es/programacion-tv/${date.format('YYYY-MM-DD')}?v=json`
  },
  parser({ content, channel, date }) {
    let programs = []
    let items = parseItems(content, channel)
    if (!items.length) return programs
    let guideDate = date
    items.forEach(item => {
      let startTime = dayjs(
        `${guideDate.format('YYYY-MM-DD')} ${item.HORA_INICIO}`,
        'YYYY-MM-DD HH:mm'
      )
      let stopTime = dayjs(`${guideDate.format('YYYY-MM-DD')} ${item.HORA_FIN}`, 'YYYY-MM-DD HH:mm')
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
