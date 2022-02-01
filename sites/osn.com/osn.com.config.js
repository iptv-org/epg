const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'osn.com',
  url: `https://www.osn.com/CMSPages/TVScheduleWebService.asmx/GetTVChannelsProgramTimeTable`,
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Referer: 'https://www.osn.com'
    },
    data({ channel, date }) {
      const [selectedCountry, channelCode] = channel.site_id.split('#')
      return {
        newDate: date.format('MM/DD/YYYY'),
        selectedCountry,
        channelCode,
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
  const [selectedCountry] = channel.site_id.split('#')
  const tz = {
    AE: 'Asia/Dubai',
    SA: 'Asia/Riyadh',
    EG: 'Africa/Cairo',
    KW: 'Asia/Kuwait',
    QA: 'Asia/Qatar',
    BH: 'Asia/Bahrain',
    OM: 'Asia/Muscat',
    JO: 'Asia/Amman',
    LB: 'Asia/Beirut',
    IQ: 'Asia/Baghdad',
    AG: 'Africa/Algiers',
    LY: 'Africa/Tripoli',
    MA: 'Africa/Casablanca',
    PS: 'Asia/Gaza',
    CH: 'Africa/Ndjamena',
    YE: 'Asia/Aden',
    MR: 'Africa/Nouakchott'
  }

  return dayjs.tz(time, 'DD MMM YYYY, HH:mm', tz[selectedCountry])
}

function parseItems(content) {
  if (!content) return []
  const json = JSON.parse(content)

  return json.d ? JSON.parse(json.d) : []
}
