const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.extend(duration)

module.exports = {
  site: 's.mxtv.jp',
  days: 1,
  lang: 'ja',
  url: function ({ date, channel }) {
    const id = `SV${channel.site_id}EPG${date.format('YYYYMMDD')}`
    return `https://s.mxtv.jp/bangumi_file/json01/${id}.json`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.Event_name,
        description: item.Event_text,
        category: parseCategory(item),
        image: parseImage(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })
    return programs
  },
  channels() {
    return [
      {
        lang: 'ja',
        site_id: '1',
        name: 'Tokyo MX1',
        xmltv_id: 'TokyoMX1.jp'
      },
      {
        lang: 'ja',
        site_id: '2',
        name: 'Tokyo MX2',
        xmltv_id: 'TokyoMX2.jp'
      }
    ]
  }
}

function parseImage() {
  // Should return a string if we can output an image URL
  // Might be done with `https://s.mxtv.jp/bangumi/link/weblinkU.csv?1722421896752` ?
  return null
}

function parseCategory() {
  // Should return a string if we can determine the category
  // Might be done with `https://s.mxtv.jp/index_set/csv/ranking_bangumi_allU.csv` ?
  return null
}

function parseStart(item) {
  return dayjs.tz(item.Start_time.toString(), 'YYYY年MM月DD日HH時mm分ss秒', 'Asia/Tokyo')
}

function parseStop(item) {
  // Add the duration to the start time
  const durationDate = dayjs(item.Duration, 'HH:mm:ss')
  return parseStart(item).add(
    dayjs.duration({
      hours: durationDate.hour(),
      minutes: durationDate.minute(),
      seconds: durationDate.second()
    })
  )
}

function parseItems(content) {
  return JSON.parse(content) || []
}
