const jsdom = require('jsdom')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  delay: 5000,
  site: 'tv.trueid.net',
  url: function ({ channel, date }) {
    return `https://tv.trueid.net/tvguide/all/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  request: {
    jar: null
  },
  logo: function ({ content, channel }) {
    const data = parseContent(content, channel)

    return data ? data.logo : null
  },
  parser: function ({ content, channel }) {
    let programs = []
    const data = parseContent(content, channel)
    const items = parseItems(data)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = parseStop(item)

      programs.push({
        title: item.title,
        icon: parseIcon(item),
        start,
        stop
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
  const virtualConsole = new jsdom.VirtualConsole()
  virtualConsole.sendTo(console, { omitJSDOMErrors: true })
  const dom = new jsdom.JSDOM(content, { virtualConsole })
  const elem = dom.window.document.getElementById('__NEXT_DATA__') || { textContent: '' }
  if (!elem.textContent) return null
  const data = JSON.parse(elem.textContent)
  const channels = data.props?.pageProps?.listEPG?.data || []

  return channels.find(ch => ch.slug === channel.site_id)
}

function parseItems(data) {
  if (!data) return []

  return data.programList || []
}
