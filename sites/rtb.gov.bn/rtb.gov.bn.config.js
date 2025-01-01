const pdf = require('pdf-parse')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'rtb.gov.bn',
  days: 2,
  url: function ({ channel, date }) {
    return encodeURI(
      `http://www.rtb.gov.bn/PublishingImages/SitePages/Programme Guide/${
        channel.site_id
      } ${date.format('DD MMMM YYYY')}.pdf`
    )
  },
  parser: async function ({ buffer, date }) {
    let programs = []
    const items = await parseItems(buffer)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      let start = parseStart(item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(1, 'h')
      programs.push({
        title: item.title,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  const dateString = `${date.format('YYYY-MM-DD')} ${item.time}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', 'Asia/Brunei')
}

async function parseItems(buffer) {
  let data
  try {
    data = await pdf(buffer)
  } catch {
    return []
  }

  if (!data) return []

  return data.text
    .split('\n')
    .filter(s => {
      const string = s.trim()

      return string && /^\d{2}:\d{2}/.test(string)
    })
    .map(s => {
      const [, time, title] = s.trim().match(/^(\d{2}:\d{2}) (.*)/) || [null, null, null]

      return { time, title }
    })
}
