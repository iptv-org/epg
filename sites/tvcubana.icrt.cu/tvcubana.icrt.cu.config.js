const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(timezone)

module.exports = {
  site: 'tvcubana.icrt.cu',
  days: 2,
  url({ channel, date }) {
    const daysOfWeek = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

    return `https://www.tvcubana.icrt.cu/cartv/${channel.site_id}/${daysOfWeek[date.day()]}.php`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.description,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  }
}

function parseStart(item) {
  return dayjs.tz(item.eventInitialDateTime, 'America/Havana')
}

function parseStop(item) {
  return dayjs.tz(item.eventEndDateTime, 'America/Havana')
}

function parseItems(content) {
  let data
  try {
    data = JSON.parse(content)
  } catch {
    return []
  }
  if (!data || !Array.isArray(data)) return []

  return data
}
