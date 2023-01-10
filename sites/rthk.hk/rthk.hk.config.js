const axios = require('axios')
const dayjs = require('dayjs')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'rthk.hk',
  days: 2,
  request: {
    headers({ channel }) {
      return {
        Cookie: `lang=${channel.lang}`
      }
    },
    cache: {
      ttl: 60 * 60 * 1000 // 1h
    }
  },
  url: function ({ date }) {
    return `https://www.rthk.hk/timetable/main_timetable/${date.format('YYYYMMDD')}`
  },
  parser({ content, channel, date }) {
    const programs = []
    const items = parseItems(content, channel)
    for (let item of items) {
      const $item = cheerio.load(item)
      programs.push({
        title: parseTitle($item),
        sub_title: parseSubTitle($item),
        categories: parseCategories($item),
        icon: parseIcon($item),
        start: parseStart($item, date),
        stop: parseStop($item, date)
      })
    }

    return programs
  }
}

function parseIcon($item) {
  return $item('.single-wrap').data('p')
}

function parseCategories($item) {
  let cate = $item('.single-wrap').data('cate') || ''
  let [_, categories] = cate.match(/^\|(.*)\|$/) || [null, '']

  return categories.split('||').filter(Boolean)
}

function parseTitle($item) {
  return $item('.showTit').attr('title')
}

function parseSubTitle($item) {
  return $item('.showEpi').attr('title')
}

function parseStart($item, date) {
  const timeRow = $item('.timeRow').text().trim()
  const [_, HH, mm] = timeRow.match(/^(\d+):(\d+)-/) || [null, null, null]
  if (!HH || !mm) return null

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${HH}:${mm}`, 'YYYY-MM-DD HH:mm', 'Asia/Hong_Kong')
}

function parseStop($item, date) {
  const timeRow = $item('.timeRow').text().trim()
  const [_, HH, mm] = timeRow.match(/-(\d+):(\d+)$/) || [null, null, null]
  if (!HH || !mm) return null

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${HH}:${mm}`, 'YYYY-MM-DD HH:mm', 'Asia/Hong_Kong')
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.result)) return []
  const channelData = data.result.find(i => i.key == channel.site_id)
  if (!channelData || !channelData.data) return []
  const $ = cheerio.load(channelData.data)

  return $('.showWrap').toArray()
}
