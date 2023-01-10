const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  delay: 5000,
  site: 'tv.trueid.net',
  days: 2,
  url: function ({ channel, date }) {
    return `https://tv.trueid.net/tvguide/all/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  request: {
    jar: null
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title,
        icon: parseIcon(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  }
}

function parseIcon(item) {
  return item.detail ? item.detail.thumb : null
}

function parseStart(item) {
  return item.detail ? dayjs.utc(item.detail.start_date) : null
}

function parseStop(item) {
  return item.detail ? dayjs.utc(item.detail.end_date) : null
}

function parseContent(content, channel) {
  const $ = cheerio.load(content)
  const nextData = $('#__NEXT_DATA__').html()
  const data = JSON.parse(nextData)
  if (
    !data ||
    !data.props ||
    !data.props.pageProps ||
    !data.props.pageProps.listEPG ||
    !Array.isArray(data.props.pageProps.listEPG.data)
  )
    return null

  return data.props.pageProps.listEPG.data.find(ch => ch.slug === channel.site_id)
}

function parseItems(content, channel) {
  const data = parseContent(content, channel)
  if (!data || !Array.isArray(data.programList)) return []

  return data.programList
}
