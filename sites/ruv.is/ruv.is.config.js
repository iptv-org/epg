const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'ruv.is',
  url({ channel, date }) {
    return `https://www.ruv.is/sjonvarp/dagskra/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  parser({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      let start = parseStart(item, date)
      let stop = parseStop(item, date)
      if (stop.isBefore(start)) {
        stop = stop.add(1, 'd')
      }
      programs.push({
        title: item.title,
        description: item.description,
        icon: parseIcon(item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseIcon(item) {
  return item.image.replace('$$IMAGESIZE$$', '480')
}

function parseStart(item, date) {
  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${item.start_time_friendly}`,
    'YYYY-MM-DD HH:mm',
    'Atlantic/Reykjavik'
  )
}

function parseStop(item, date) {
  return dayjs.tz(
    `${date.format('YYYY-MM-DD')} ${item.end_time_friendly}`,
    'YYYY-MM-DD HH:mm',
    'Atlantic/Reykjavik'
  )
}

function parseItems(content, channel, date) {
  const $ = cheerio.load(content)
  const apollo = $('#apollo').html()
  const [, state] = apollo.match(/window.__APOLLO_STATE__ = ([^;<]+)/) || [null, '']
  const data = JSON.parse(state)

  return (
    data?.ROOT_QUERY?.[
      `Schedule({"channel":"${channel.site_id}","date":"${date.format('YYYY-MM-DD')}"})`
    ]?.events || []
  )
}
