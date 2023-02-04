const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const API_ENDPOINT = 'https://www.dsmart.com.tr/api/v1/public/epg/schedules'

module.exports = {
  site: 'dsmart.com.tr',
  days: 2,
  url({ date, channel }) {
    const [page] = channel.site_id.split('#')

    return `${API_ENDPOINT}?page=${page}&limit=1&day=${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ content, channel }) {
    let offset = -1
    let programs = []
    const items = parseItems(content, channel)
    items.forEach((item, i) => {
      const prev = programs[programs.length - 1]
      let start
      if (prev) {
        start = parseStart(item, prev.stop)
      } else {
        start = parseStart(item, dayjs.utc(item.day))
      }
      let duration = parseDuration(item)
      let stop = start.add(duration, 's')

      programs.push({
        title: item.program_name,
        category: parseCategory(item),
        description: item.description.trim(),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const perPage = 1
    const totalChannels = 210
    const pages = Math.ceil(totalChannels / perPage)

    const channels = []
    for (let i in Array(pages).fill(0)) {
      const page = parseInt(i) + 1
      const url = `${API_ENDPOINT}?page=${page}&limit=${perPage}&day=${dayjs().format(
        'YYYY-MM-DD'
      )}`
      let offset = i * perPage
      await axios
        .get(url)
        .then(r => r.data)
        .then(data => {
          offset++
          if (data && data.data && Array.isArray(data.data.channels)) {
            data.data.channels.forEach((item, j) => {
              const index = offset + j
              channels.push({
                lang: 'tr',
                name: item.channel_name,
                site_id: index + '#' + item._id
              })
            })
          }
        })
        .catch(err => {
          console.log(err.message)
        })
    }

    return channels
  }
}

function parseCategory(item) {
  return item.genre !== '0' ? item.genre : null
}

function parseStart(item, date) {
  const time = dayjs.utc(item.start_date)

  return dayjs.utc(`${date.format('YYYY-MM-DD')} ${time.format('HH:mm:ss')}`, 'YYYY-MM-DD HH:mm:ss')
}

function parseDuration(item) {
  const [_, H, mm, ss] = item.duration.match(/(\d+):(\d+):(\d+)$/)

  return parseInt(H) * 3600 + parseInt(mm) * 60 + parseInt(ss)
}

function parseItems(content, channel) {
  const [, channelId] = channel.site_id.split('#')
  const data = JSON.parse(content)
  if (!data || !data.data || !Array.isArray(data.data.channels)) return null
  const channelData = data.data.channels.find(i => i._id == channelId)

  return channelData && Array.isArray(channelData.schedule) ? channelData.schedule : []
}
