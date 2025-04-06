const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const parseDuration = require('parse-duration').default

dayjs.extend(utc)

module.exports = {
  site: 'freeview.co.uk',
  days: 2,
  url({ date, channel }) {
    const [networkId] = channel.site_id.split('#')
    const startTimestamp = date.startOf('d').unix()

    return `https://www.freeview.co.uk/api/tv-guide?nid=${networkId}&start=${startTimestamp}`
  },
  parser({ content, channel }) {
    let programs = []
    let items = parseItems(content, channel)
    items.forEach(item => {
      const start = parseStart(item)
      const duration = parseDuration(item.duration)
      const stop = start.add(duration, 'ms')
      programs.push({
        title: item.main_title,
        subtitle: item.secondary_title,
        image: parseImage(item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const networkId = '64257' // Great London
    const startTimestamp = dayjs.utc().startOf('d').unix()
    const data = await axios
      .get(`https://www.freeview.co.uk/api/tv-guide?nid=${networkId}&start=${startTimestamp}`)
      .then(r => r.data)
      .catch(console.log)

    return data.data.programs.map(item => ({
      lang: 'en',
      site_id: `${networkId}#${item.service_id}`,
      name: item.title
    }))
  }
}

function parseImage(item) {
  return item.image_url ? `${item.image_url}?w=800` : null
}

function parseStart(item) {
  return dayjs(item.start_time)
}

function parseItems(content, channel) {
  try {
    const data = JSON.parse(content)
    const programs = data?.data?.programs
    if (!Array.isArray(programs)) return []
    const [, channelId] = channel.site_id.split('#')
    const channelData = programs.find(p => p.service_id === channelId)
    const channelPrograms = channelData?.events
    if (!Array.isArray(channelPrograms)) return []

    return channelPrograms
  } catch {
    return []
  }
}
