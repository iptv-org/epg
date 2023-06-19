const cheerio = require('cheerio')
const { DateTime } = require('luxon')

module.exports = {
  site: 'cosmote.gr',
  days: 2,
  request: {
    timeout: 30000 // 30 seconds
  },
  url: function ({ date, channel }) {
    return `https://www.cosmotetv.gr/portal/residential/program/epg/programchannel?p_p_id=channelprogram_WAR_OTETVportlet&p_p_lifecycle=0&_channelprogram_WAR_OTETVportlet_platform=IPTV&_channelprogram_WAR_OTETVportlet_date=${date.format(
      'DD-MM-YYYY'
    )}&_channelprogram_WAR_OTETVportlet_articleTitleUrl=${channel.site_id}`
  },
  parser: function ({ date, content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach((item, i) => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (i === 0 && start.hour > 12 && start.hour < 21) {
        date = date.subtract(1, 'd')
        start = start.minus({ days: 1 })
      }
      if (prev && start < prev.start) {
        start = start.plus({ days: 1 })
        date = date.add(1, 'd')
      }
      let stop = parseStop($item, date)
      if (stop < start) {
        stop = stop.plus({ days: 1 })
        date = date.add(1, 'd')
      }
      programs.push({
        title: parseTitle($item),
        category: parseCategory($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseTitle($item) {
  return $item('.channel_program-table--program > a').text()
}

function parseCategory($item) {
  const typeString = $item('.channel_program-table--program_type')
    .children()
    .remove()
    .end()
    .text()
    .trim()
  const [_, category] = typeString.match(/\| (.*)/) || [null, null]

  return category
}

function parseStart($item, date) {
  const timeString = $item('span.start-time').text()
  const dateString = `${date.format('YYYY-MM-DD')} ${timeString}`

  return DateTime.fromFormat(dateString, 'yyyy-MM-dd HH:mm', { zone: 'Europe/Athens' }).toUTC()
}

function parseStop($item, date) {
  const timeString = $item('span.end-time').text()
  const dateString = `${date.format('YYYY-MM-DD')} ${timeString}`

  return DateTime.fromFormat(dateString, 'yyyy-MM-dd HH:mm', { zone: 'Europe/Athens' }).toUTC()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#_channelprogram_WAR_OTETVportlet_programs > tr.d-sm-table-row').toArray()
}
