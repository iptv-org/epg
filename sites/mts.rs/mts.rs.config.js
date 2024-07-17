const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'mts.rs',
  days: 2,
  url({ date, channel }) {
    const [position] = channel.site_id.split('#')

    return `https://mts.rs/oec/epg/program?date=${date.format('YYYY-MM-DD')}&position=${position}`
  },
  request: {
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  },
  parser: function ({ content, channel }) {
    let programs = []
    const data = parseContent(content, channel)
    const items = parseItems(data)
    items.forEach(item => {
      programs.push({
        title: item.title,
        category: item.category,
        description: item.description,
        image: item.image,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    let channels = []

    const totalPages = await getTotalPageCount()
    const pages = Array.from(Array(totalPages).keys())
    for (let page of pages) {
      const data = await axios
        .get(`https://mts.rs/oec/epg/program`, {
          params: { page, date: dayjs().format('YYYY-MM-DD') },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
        .then(r => r.data)
        .catch(console.log)

      data.channels.forEach(item => {
        channels.push({
          lang: 'bs',
          site_id: `${item.position}#${item.id}`,
          name: item.name
        })
      })
    }

    return channels
  }
}

async function getTotalPageCount() {
  const data = await axios
    .get(`https://mts.rs/oec/epg/program`, {
      params: { page: 0, date: dayjs().format('YYYY-MM-DD') },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(r => r.data)
    .catch(console.log)

  return data.total_pages
}

function parseContent(content, channel) {
  const [, site_id] = channel.site_id.split('#')
  let data
  try {
    data = JSON.parse(content)
  } catch (error) {
    console.log(error)
  }
  if (!data || !data.channels || !data.channels.length) return null

  return data.channels.find(c => c.id === site_id) || null
}

function parseStart(item) {
  return dayjs.tz(item.full_start, 'Europe/Belgrade')
}

function parseStop(item) {
  return dayjs.tz(item.full_end, 'Europe/Belgrade')
}

function parseItems(data) {
  return data && Array.isArray(data.items) ? data.items : []
}
