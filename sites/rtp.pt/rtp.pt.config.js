const _ = require('lodash')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'rtp.pt',
  url({ channel, date }) {
    return `https://www.rtp.pt/EPG/json/rtp-channels-page/list-grid/tv/${
      channel.site_id
    }/${date.format('D-M-YYYY')}`
  },
  parser({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      let start = parseStart(item)
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
  },
  async channels() {
    const items = await axios
      .get('https://www.rtp.pt/EPG/json/rtp-home-page/list-channels/tv')
      .then(r => r.data.result)
      .catch(console.error)

    return items.map(i => {
      return {
        lang: 'pt',
        site_id: i.channel_code,
        name: i.channel_name
      }
    })
  }
}

function parseIcon(item) {
  const last = item.image.pop()

  return last?.src
}

function parseStart(item) {
  return dayjs.tz(item.date, 'YYYY-MM-DD HH:mm:ss', 'Europe/Lisbon')
}

function parseItems(content) {
  if (!content) return []
  const data = JSON.parse(content)

  return _.flatten(Object.values(data.result))
}
