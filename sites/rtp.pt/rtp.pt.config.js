const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const fs = require('fs')
const path = require('path')
const { EPGGrabber } = require('epg-grabber')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const tz = {
  lis: 'Europe/Lisbon',
  per: 'Asia/Macau',
  rja: 'America/Sao_Paulo'
}

module.exports = {
  site: 'rtp.pt',
  channels: async () => {
    const channelsPath = path.resolve(__dirname, 'rtp.pt.channels.xml')

    if (!fs.existsSync(channelsPath)) {
      console.warn(`Channels file not found: ${channelsPath}. Returning empty list.`)
      return []
    }

    const xml = fs.readFileSync(channelsPath, 'utf8')
    const parsed = EPGGrabber.parseChannelsXML(xml)

    return parsed.map(channel => ({
      xmltv_id: channel.xmltv_id,
      name: channel.name,
      site_id: channel.site_id,
      lang: channel.lang,
      logo: channel.logo,
      url: channel.url,
      lcn: channel.lcn
    }))
  },
  days: 2,

  url({ channel, date }) {
    let [region, channelCode] = channel.site_id.split('#')
    return `https://www.rtp.pt/EPG/json/rtp-channels-page/list-grid/tv/${channelCode}/${date.format(
      'D-M-YYYY'
    )}/${region}`
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      let start = parseStart(item, channel)
      if (!start) return
      if (prev) {
        prev.stop = start
      }
      const stop = start.add(30, 'm')
      programs.push({
        title: item.name,
        description: item.description,
        image: parseImage(item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseImage(item) {
  const last = item.image.pop()
  if (!last) return null
  return last.src
}

function parseStart(item, channel) {
  let [region] = channel.site_id.split('#')
  return dayjs.tz(item.date, 'YYYY-MM-DD HH:mm:ss', tz[region])
}

function parseItems(content) {
  if (!content) return []
  const data = JSON.parse(content)

  return Object.values(data.result).flat()
}
