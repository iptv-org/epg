const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(timezone)

require('dayjs/locale/es')

module.exports = {
  site: 'tvcubana.icrt.cu',
  url({ channel, date }) {
    return `https://www.tvcubana.icrt.cu/cartv/${channel.site_id}/${date
      .locale('es')
      .format('dddd')}.php`
  },
  logo({ channel }) {
    return channel.logo
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

function parseItems(content, channel) {
  let data
  try {
    data = JSON.parse(content)
  } catch (e) {}
  if (!data || !Array.isArray(data)) return []

  return data
}
