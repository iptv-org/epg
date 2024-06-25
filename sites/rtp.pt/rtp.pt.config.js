const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

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
        icon: parseIcon(item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseIcon(item) {
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

  return Object.values(data.result).flat();
}
