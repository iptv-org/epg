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
  async parser({ content, channel }) {
    let programs = []
    let items = parseItems(content, channel)
    for (const item of items) {
      const start = parseStart(item)
      const duration = parseDuration(item.duration)
      const stop = start.add(duration, 'ms')
      const details = await loadProgramDetails(item)
      const synopsis = details?.synopsis
      programs.push({
        title: item.main_title,
        subtitle: item.secondary_title,
        description: synopsis?.long || synopsis?.medium || synopsis?.short || null,
        image: parseImage(item),
        start,
        stop
      })
    }

    return programs
  },
  async channels() {
    const startTimestamp = dayjs.utc().startOf('d').unix()
    let channels = []
    for (let networkId = 64257; networkId <= 64425; networkId++) { // loop through all valid networkIds starting from 64257 (Greater London) to 64425 (Belfast) to ensure we can get all the channels available on freeview
      console.log(networkId)
      const data = await axios
        .get(`https://www.freeview.co.uk/api/tv-guide?nid=${networkId}&start=${startTimestamp}`)
        .then(r => r.data)
        .catch(console.log)

      channels = channels.concat(data.data.programs.map(item => ({
        lang: 'en',
        site_id: `${networkId}#${item.service_id}`,
        name: item.title
      })))
    }
    const uniqueServiceIds = Array.from(new Set(channels.map(c => c.site_id.split('#')[1])))
    return uniqueServiceIds.map(serviceId => {
      return channels.find(c => c.site_id.split('#')[1] === serviceId)
    })
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

async function loadProgramDetails(item) {
  const url = `https://www.freeview.co.uk/api/program?pid=${item.program_id}&start_time=${item.start_time}&duration=${item.duration}`
  const data = await axios
    .get(url)
    .then(r => {
      const programs = r?.data?.data?.programs
      return Array.isArray(programs) && programs.length > 0 ? programs[0] : {}
    })
    .catch(console.log)
  return data || {}
}
