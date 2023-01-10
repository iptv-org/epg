const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: '9tv.co.il',
  days: 2,
  url: function ({ date }) {
    return `https://www.9tv.co.il/BroadcastSchedule/getBrodcastSchedule?date=${date.format(
      'DD/MM/YYYY 00:00:00'
    )}`
  },
  parser: function ({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      const start = parseStart($item, date)
      if (prev) prev.stop = start
      const stop = start.add(1, 'h')
      programs.push({
        title: parseTitle($item),
        icon: parseIcon($item),
        description: parseDescription($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart($item, date) {
  let time = $item('a > div.guide_list_time').text().trim()

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Asia/Jerusalem')
}

function parseIcon($item) {
  const backgroundImage = $item('a > div.guide_info_group > div.guide_info_pict').css(
    'background-image'
  )
  if (!backgroundImage) return null
  const [_, relativePath] = backgroundImage.match(/url\((.*)\)/) || [null, null]

  return relativePath ? `https://www.9tv.co.il${relativePath}` : null
}

function parseDescription($item) {
  return $item('a > div.guide_info_group > div.guide_txt_group > div').text().trim()
}

function parseTitle($item) {
  return $item('a > div.guide_info_group > div.guide_txt_group > h3').text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('li').toArray()
}
