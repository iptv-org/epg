const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'osn.com',
  days: 2,
  url({ channel, date }) {
    return `https://www.osn.com/api/TVScheduleWebService.asmx/time?dt=${encodeURIComponent(
      date.format('MM/DD/YYYY')
    )}&co=AE&ch=${channel.site_id}&mo=false&hr=0`
  },
  request: {
    headers({ channel }) {
      return {
        Referer: `https://www.osn.com/${channel.lang}-ae/watch/tv-schedule`
      }
    }
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
  },
  async channels({ lang = 'ar' }) {
    const axios = require('axios')
    const pages = Array.from({ length: 9 }, (_, i) => i + 1);
    const results = await Promise.all(pages.map(pg => axios.get(`https://www.osn.com/api/TVScheduleWebService.asmx/chnl?pg=${pg}&pk=0&gn=0&cu=ar-AE&bx=1&dt=${encodeURIComponent(
      date.format('MM/DD/YYYY'))}`).then(response => response.data).catch(console.error)));

    const channels = results.flat().filter(Boolean).map(channel => ({
    lang: lang,
    site_id: channel.channelCode,
    name: channel.channeltitle
    }));

    return channels
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