const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  skip: true, // NOTE: return an HTTP error 302 on requests from GitHub server (https://github.com/iptv-org/epg/issues/1654#issuecomment-1382915005)
  site: 'osn.com',
  days: 2,
  url: `https://www.osn.com/CMSPages/TVScheduleWebService.asmx/GetTVChannelsProgramTimeTable`,
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Referer: 'https://www.osn.com'
    },
    data({ channel, date }) {
      return {
        newDate: date.format('MM/DD/YYYY'),
        selectedCountry: 'AE',
        channelCode: channel.site_id,
        isMobile: false,
        hoursForMobile: 0
      }
    },
    jar: null
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const start = parseStart(item, channel)
      const duration = parseDuration(item)
      const stop = start.add(duration, 'm')
      programs.push({
        title: parseTitle(item, channel),
        category: parseCategory(item, channel),
        start: start.toString(),
        stop: stop.toString()
      })
    })

    return programs
  }
}

function parseTitle(item, channel) {
  return channel.lang === 'ar' ? item.Arab_Title : item.Title
}

function parseCategory(item, channel) {
  return channel.lang === 'ar' ? item.GenreArabicName : item.GenreEnglishName
}

function parseDuration(item) {
  return parseInt(item.TotalDivWidth / 4.8)
}

function parseStart(item, channel) {
  const time = item.StartDateTime

  return dayjs.tz(time, 'DD MMM YYYY, HH:mm', 'Asia/Dubai')
}

function parseItems(content) {
  if (!content) return []
  const json = JSON.parse(content)

  return json.d ? JSON.parse(json.d) : []
}
