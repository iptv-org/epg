const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'canalplus-reunion.com',
  days: 2,
  url: function ({ channel, date }) {
    const diff = date.diff(dayjs.utc().startOf('d'), 'd')

    return `https://service.canal-overseas.com/ott-frontend/vector/63001/channel/${channel.site_id}/events?filter.day=${diff}`
  },
  async parser({ content }) {
    let programs = []
    const items = parseItems(content)
    for (let item of items) {
      if (item.title === 'Fin des programmes') return
      const detail = await loadProgramDetails(item)
      programs.push({
        title: item.title,
        description: parseDescription(detail),
        category: parseCategory(detail),
        icon: parseIcon(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    }

    return programs
  }
}

async function loadProgramDetails(item) {
  if (!item.onClick.URLPage) return {}
  const url = item.onClick.URLPage
  const data = await axios
    .get(url)
    .then(r => r.data)
    .catch(console.log)
  return data || {}
}

function parseDescription(detail) {
  return detail.detail.informations.summary || null
}

function parseCategory(detail) {
  return detail.detail.informations.subGenre || null
}
function parseIcon(item) {
  return item.URLImage || item.URLImageDefault
}
function parseStart(item) {
  return dayjs.unix(item.startTime).tz("Indian/Reunion")
}

function parseStop(item) {
  return dayjs.unix(item.endTime).tz("Indian/Reunion")
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !data.timeSlices) return []
  const items = data.timeSlices.reduce((acc, curr) => {
    acc = acc.concat(curr.contents)
    return acc
  }, [])

  return items
}
