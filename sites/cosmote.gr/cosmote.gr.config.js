const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'cosmote.gr',
  days: 2,
  url: function ({ date, channel }) {
    return `https://www.cosmote.gr/cosmotetv/residential/program/epg/programchannel?p_p_id=channelprogram_WAR_OTETVportlet&p_p_lifecycle=0&_channelprogram_WAR_OTETVportlet_platform=IPTV&_channelprogram_WAR_OTETVportlet_date=${date.format(
      'DD-MM-YYYY'
    )}&_channelprogram_WAR_OTETVportlet_articleTitleUrl=${channel.site_id}`
  },
  parser: function ({ date, content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (prev && start.isBefore(prev.start)) {
        start = start.add(1, 'd')
        date = date.add(1, 'd')
      }
      let stop = parseStop($item, date)
      if (stop.isBefore(start)) {
        stop = stop.add(1, 'd')
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

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', 'Europe/Athens')
}

function parseStop($item, date) {
  const timeString = $item('span.end-time').text()
  const dateString = `${date.format('YYYY-MM-DD')} ${timeString}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', 'Europe/Athens')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#_channelprogram_WAR_OTETVportlet_programs > tr.visible-xs').toArray()
}
