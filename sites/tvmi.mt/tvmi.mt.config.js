const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'tvmi.mt',
  url: function ({ date }) {
    return `https://www.tvmi.mt/mt/tvmi/skeda/?sd-date=${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const $item = cheerio.load(item)
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        icon: parseIcon($item),
        start: parseStart($item, date),
        stop: parseStop($item, date)
      })
    })

    return programs
  }
}

function parseTitle($item) {
  return $item('.programme-title').text().trim()
}

function parseDescription($item) {
  return $item('.description').text().trim()
}

function parseIcon($item) {
  return $item('.image').attr('src')
}

function parseStart($item, date) {
  const times = $item('.title-time > .times').text().trim()
  const [_, HH, mm] = times.match(/^(\d{2}):(\d{2}) \-/) || [null, null, null]
  if (!HH || !mm) return null

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${HH}:${mm}`, 'YYYY-MM-DD HH:mm', 'Europe/Malta')
}

function parseStop($item, date) {
  const times = $item('.title-time > .times').text().trim()
  const [_, HH, mm] = times.match(/\- (\d{2}):(\d{2})$/) || [null, null, null]
  if (!HH || !mm) return null

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${HH}:${mm}`, 'YYYY-MM-DD HH:mm', 'Europe/Malta')
}

function parseItems(content, channel) {
  const $ = cheerio.load(content)
  const channelSchedules = $(
    '#content > div.schedule > div.content > div.schedule-bottom > div.schedules > .channel-schedule'
  ).toArray()
  if (!Array.isArray(channelSchedules)) return []
  const index = parseInt(channel.site_id) - 1
  if (!channelSchedules[index]) return []

  return $(channelSchedules[index], '.programmes').find('.remodal').toArray()
}
