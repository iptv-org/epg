const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'mediaklikk.hu',
  days: 2,
  url: 'https://mediaklikk.hu/wp-content/plugins/hms-global-widgets/widgets/programGuide/programGuideInterface.php',
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: function ({ date, channel }) {
      const params = new URLSearchParams()
      params.append('ChannelIds', `${channel.site_id},`)
      params.append('Date', date.format('YYYY-MM-DD'))

      return params
    }
  },
  parser: function ({ content }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const start = parseStart($item)
      let stop = parseStop($item)
      if (!stop) stop = start.add(30, 'm')
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        icon: parseIcon($item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart($item) {
  const timeString = $item('*').data('from')

  return dayjs(timeString, 'YYYY-MM-DD HH:mm:ssZZ')
}

function parseStop($item) {
  const timeString = $item('*').data('till')
  if (!timeString || /^\+/.test(timeString)) return null

  try {
    return dayjs(timeString, 'YYYY-MM-DD HH:mm:ssZZ')
  } catch (err) {
    return null
  }
}

function parseTitle($item) {
  return $item('.program_info > h1').text().trim()
}

function parseDescription($item) {
  return $item('.program_about > .program_description > p').text().trim()
}

function parseIcon($item) {
  const backgroundImage = $item('.program_about > .program_photo').css('background-image')
  if (!backgroundImage) return null
  const [_, icon] = backgroundImage.match(/url\(\'(.*)'\)/) || [null, null]
  if (!icon) return null

  return `https:${icon}`
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('li.program_body').toArray()
}
