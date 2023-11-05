const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'osn.com',
  days: 2,
  headers({ channel }) {
    return {
      'Content-Type': 'application/json; charset=UTF-8',
      Referer: `https://www.osn.com/${channel.lang}-ae/watch/tv-schedule`,
    }
  },
  url({ channel, date }) {
    return `https://www.osn.com/api/TVScheduleWebService.asmx/GetTVChannelsProgramTimeTable?newDate=${
      encodeURIComponent(date.format('MM/DD/YYYY'))
    }&selectedCountry=AE&channelCode=${channel.site_id}&isMobile=false&hoursForMobile=6`
  },
  parser({ content, channel }) {
    const programs = []
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

function parseStart(item) {
  const time = item.StartDateTime

  return dayjs.tz(time, 'DD MMM YYYY, HH:mm', 'Asia/Dubai')
}

function parseItems(content) {
  return content ? JSON.parse(content) : []
}
