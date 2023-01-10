const dayjs = require('dayjs')
const axios = require('axios')

// TODO: calculate API_KEY based on the current date
//
// const API_KEY = 'f55e5c7ddf0afba59d1c64581358910d' // 03.2022
//const API_KEY = 'c71b6b8eb30125dab9d10a3850131ac6' // 05.2022
const API_KEY = 'da2291af3b10e9900d1c55e1a65d3388' // 10.2022

module.exports = {
  site: 'canalplus.com',
  days: 2,
  url: function ({ channel, date }) {
    const diff = date.diff(dayjs.utc().startOf('d'), 'd')

    return `https://hodor.canalplus.pro/api/v2/mycanal/channels/${API_KEY}/${channel.site_id}/broadcasts/day/${diff}`
  },
  async parser({ content }) {
    let programs = []
    const items = parseItems(content)
    for (let item of items) {
      const prev = programs[programs.length - 1]
      const details = await loadProgramDetails(item)
      const info = parseInfo(details)
      const start = parseStart(item)
      if (prev) prev.stop = start
      const stop = start.add(1, 'h')
      programs.push({
        title: item.title,
        description: parseDescription(info),
        icon: parseIcon(info),
        start,
        stop
      })
    }

    return programs
  },
  async channels() {
    const data = await axios
      .get(`https://secure-webtv-static.canal-plus.com/metadata/cpfra/all/v2.2/globalchannels.json`)
      .then(r => r.data)
      .catch(console.log)

    return data.channels.map(item => {
      return {
        lang: 'fr',
        site_id: item.id,
        name: item.name
      }
    })
  }
}

function parseStart(item) {
  return item && item.startTime ? dayjs(item.startTime) : null
}

function parseIcon(info) {
  return info ? info.URLImage : null
}

function parseDescription(info) {
  return info ? info.summary : null
}

function parseInfo(data) {
  if (!data || !data.detail || !data.detail.informations) return null

  return data.detail.informations
}

async function loadProgramDetails(item) {
  if (!item.onClick || !item.onClick.URLPage) return {}

  return await axios
    .get(item.onClick.URLPage)
    .then(r => r.data)
    .catch(console.error)
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.timeSlices)) return []

  return data.timeSlices.reduce((acc, curr) => {
    acc = acc.concat(curr.contents)
    return acc
  }, [])
}
