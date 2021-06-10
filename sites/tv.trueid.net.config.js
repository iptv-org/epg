const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  lang: 'th',
  site: 'tv.trueid.net',
  channels: 'tv.trueid.net.channels.xml',
  request: {
    timeout: 60000
  },
  output: '.gh-pages/guides/tv.trueid.net.guide.xml',
  url: function () {
    return `https://tv.trueid.net/tvguide/all`
  },
  logo: function ({ content, channel }) {
    const data = parseContent(content)
    const channels = data.props?.pageProps?.listEPG?.data || []
    const channelData = channels.find(ch => ch.slug === channel.site_id)

    return channelData.logo
  },
  parser: function ({ content, channel }) {
    let programs = []
    const data = parseContent(content)
    const channels = data.props?.pageProps?.listEPG?.data || []
    const channelData = channels.find(ch => ch.slug === channel.site_id)
    if (!channelData || !channelData.programList.length) return programs
    const items = channelData.programList
    items.forEach(item => {
      if (item.title && item.detail) {
        const start = dayjs.utc(item.detail.start_date)
        const stop = dayjs.utc(item.detail.end_date)
        const icon = item.detail.thumb
        programs.push({
          title: item.title,
          start: start.toString(),
          stop: stop.toString(),
          icon
        })
      }
    })

    return programs
  }
}

function parseContent(content) {
  const virtualConsole = new jsdom.VirtualConsole()
  virtualConsole.sendTo(console, { omitJSDOMErrors: true })
  const dom = new JSDOM(content, { virtualConsole })
  const elem = dom.window.document.getElementById('__NEXT_DATA__') || { textContent: '' }
  if (!elem.textContent) return {}

  return JSON.parse(elem.textContent)
}
