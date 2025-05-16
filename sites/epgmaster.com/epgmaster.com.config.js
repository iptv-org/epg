const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const TOKEN = '1610283054'

module.exports = {
  site: 'epgmaster.com',
  url({ channel }) {
    return `https://epgmaster.com/api/channels/${channel.site_id}/epgs?token=${TOKEN}`
  },
  parser({ content, date }) {
    return parseItems(content, date).map(item => {
      return {
        title: item.programName,
        start: parseStart(item),
        stop: parseStop(item)
      }
    })
  }
}

function parseStart(item) {
  return dayjs.utc(`${item.startDate} ${item.startTime}`, 'YYYY-MM-DD HH:mm:ss')
}

function parseStop(item) {
  return dayjs.utc(`${item.startDate} ${item.endTime}`, 'YYYY-MM-DD HH:mm:ss')
}

function parseItems(content, date) {
  try {
    const data = JSON.parse(content)
    if (!data || !Array.isArray(data)) return []
    const filtered = data.find(group => date.format('YYYY-MM-DD') === group.date)
    if (!filtered || !Array.isArray(filtered.epgTokenList)) return []

    return filtered.epgTokenList
  } catch {
    return []
  }
}
