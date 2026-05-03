const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const isToday = require('dayjs/plugin/isToday')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

require('dayjs/locale/ar')

dayjs.extend(utc)
dayjs.extend(isToday)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'ayn.om',
  days: 2,
  url({ channel }) {
    return `https://ayn.om/schedule/${channel.site_id}`
  },
  parser({ content, date }) {
    const items = parseItems(content, date)

    let programs = []
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      const start = parseStart($item, date)
      if (prev) prev.stop = start
      const stop = start.add(1, 'h')

      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  },
  channels() {
    return [
      {
        lang: 'ar',
        name: 'قناة عمان العامة',
        site_id: '158/قناة-عمان-العامة'
      },
      {
        lang: 'ar',
        name: 'قناة عمان الرياضية',
        site_id: '159/قناة-عمان-الرياضية'
      },
      {
        lang: 'ar',
        name: 'قناة عمان الثقافية',
        site_id: '160/قناة-عمان-الثقافية'
      },
      {
        lang: 'ar',
        name: 'قناة عمان مباشر',
        site_id: '161/قناة-عمان-مباشر'
      }
    ]
  }
}

function parseTitle($item) {
  return $item('*').attr('title')
}

function parseStart($item, date) {
  const time = $item('p').text().trim()

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Asia/Muscat')
}

function parseItems(content, date) {
  const $ = cheerio.load(content)

  let day
  if (date.isToday()) {
    day = 'اليوم'
  } else {
    day = date.locale('ar').format('dddd')
  }

  const $heading = $(
    `#day-1 > div.epg_bottom_sec > div > div > div.epg_channel_wrap > div > div.epg_timeline_aside > div > div > div > div > h3:contains("${day}")`
  )

  if (!$heading.length) return []

  const $wrapper = $heading.closest('.epg_channel_wrap')

  if (!$wrapper.length) return []

  const items = $wrapper
    .find('.epg_swipe_wrapper > .epg_swipe_inner_wrap > .epg_timeline_show_row > .epg_tl_item')
    .toArray()

  if (!Array.isArray(items)) return []

  return items
}
