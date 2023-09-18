process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'directv.com.ar',
  days: 2,
  url: `https://www.directv.com.ar/guia/ChannelDetail.aspx/GetProgramming`,
  request: {
    method: 'POST',
    headers: {
      'Cookie': 'PGCSS=16; PGLang=S; PGCulture=es-AR;',
      'Accept': '*/*',
      'Accept-Language': 'es-419,es;q=0.9',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json; charset=UTF-8',
      'Origin': 'https://www.directv.com.ar',
      'Referer': 'https://www.directv.com.ar/guia/ChannelDetail.aspx?id=1740&name=TLCHD',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    },
    data({ channel, date }) {
      const [channelNum, channelName] = channel.site_id.split('#')

      return {
        filterParameters: {
          day: date.date(),
          time: 0,
          minute: 0,
          month: date.month() + 1,
          year: date.year(),
          offSetValue: 0,
          homeScreenFilter: '',
          filtersScreenFilters: [''],
          isHd: '',
          isChannelDetails: 'Y',
          channelNum,
          channelName: channelName.replace('&amp;', '&')
        }
      }
    }
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.description,
        rating: parseRating(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  }
}

function parseRating(item) {
  return item.rating
    ? {
        system: 'MPA',
        value: item.rating
      }
    : null
}

function parseStart(item) {
  return dayjs.tz(item.startTimeString, 'M/D/YYYY h:mm:ss A', 'America/Argentina/Buenos_Aires')
}

function parseStop(item) {
  return dayjs.tz(item.endTimeString, 'M/D/YYYY h:mm:ss A', 'America/Argentina/Buenos_Aires')
}

function parseItems(content, channel) {
  if (!content) return []
  let [ChannelNumber, ChannelName] = channel.site_id.split('#')
  ChannelName = ChannelName.replace('&amp;', '&')
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.d)) return []
  const channelData = data.d.find(
    c => c.ChannelNumber == ChannelNumber && c.ChannelName === ChannelName
  )

  return channelData && Array.isArray(channelData.ProgramList) ? channelData.ProgramList : []
}
