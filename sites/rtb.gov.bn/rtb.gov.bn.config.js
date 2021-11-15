const pdf = require('pdf-parse')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  ignore: true, // INFO: guide is not available on the site
  site: 'rtb.gov.bn',
  url: function ({ channel, date }) {
    const [position] = channel.site_id.split('#')

    return encodeURI(
      `http://www.rtb.gov.bn/PublishingImages/SitePages/Programme Guide/${
        channel.site_id
      } ${date.format('DD MMMM YYYY')}.pdf`
    )
  },
  logo({ channel }) {
    return channel.logo
  },
  parser: async function ({ buffer, date }) {
    let PM = false
    let programs = []
    const items = await parseItems(buffer)
    items.forEach(item => {
      let start = parseStart(item, date)
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = start.add(1, 'h')
      if (programs.length) {
        programs[programs.length - 1].stop = start.toJSON()
      }
      programs.push({
        title: item.title,
        start: start.toJSON(),
        stop: stop.toJSON()
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  const time = `${date.format('YYYY-MM-DD')} ${item.time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'Asia/Brunei')
}

async function parseItems(buffer) {
  const data = await pdf(buffer).catch(err => null)
  if (!data) return []

  return data.text
    .split('\n')
    .filter(s => {
      const string = s.trim()

      return string && /^\d{2}:\d{2}/.test(string)
    })
    .map(s => {
      const [_, time, title] = s.trim().match(/^(\d{2}:\d{2}) (.*)/) || [null, null, null]

      return { time, title }
    })
}
