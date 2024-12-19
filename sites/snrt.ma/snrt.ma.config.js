const cheerio = require('cheerio')
const { DateTime } = require('luxon')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const channel = [{ site_id: '1208', xmltv_id: 'AlAoula.ma', lang: 'ar' },
                 { site_id: '4069', xmltv_id: 'Laayoune.ma', lang: 'ar' },
                 { site_id: '4070', xmltv_id: 'Arryadia.ma', lang: 'ar' },
                 { site_id: '4071', xmltv_id: 'Athaqafia.ma', lang: 'ar' },
                 { site_id: '4072', xmltv_id: 'AlMaghribia.ma', lang: 'ar' },
                 { site_id: '4073', xmltv_id: 'Assadissa.ma', lang: 'ar' },
                 { site_id: '4075', xmltv_id: 'Tamazight.ma', lang: 'ar' }]


module.exports = {
  site: 'snrt.ma',
  channels: 'snrt.ma.channels.xml',
  days: 2,
  url: function ({ channel }) {
    return `https://www.snrt.ma/ar/node/${channel.site_id}`
  },
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: function ({ date }) {
      const params = new URLSearchParams()
      params.append('_method', 'POST')
      params.append('data-date', date.format('YYYYMMDD'))
      params.append('current_date', date.format('YYYYMMDD'))

      return params
    }
  },
  parser: function ({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(30, 'm')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        category: parseCategory($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart($item, date) {
  const timeString  = $item('.grille-time').text().trim()
  const [hours, minutes] = timeString.split('H').map(Number)
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`

  const dateString = `${date.format('YYYY-MM-DD')} ${formattedTime}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm:ss', 'Africa/Casablanca')
}


function parseTitle($item) {
  return $item('.program-title-sm').text().trim()
}

function parseDescription($item) {
  return $item('.program-description-sm').text().trim()
}

function parseCategory($item) {
  return $item('.genre-first').text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('.grille-line').toArray()
}