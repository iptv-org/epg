const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

const TIMEZONE = 'America/New_York'

module.exports = {
  site: 'nhl.com',
  // I'm not sure what `endDate` represents but they only return 1 day of
  // results, with `endTime`s ocassionally in the following day.
  days: 1,
  url: ({ date }) =>
    `https://api-web.nhle.com/v1/network/tv-schedule/${date.toJSON().split('T')[0]}`,
  parser({ content }) {
    const programs = []
    const items = parseItems(content)
    for (const item of items) {
      programs.push({
        title: item.title,
        description: item.description === item.title ? undefined : item.description,
        category: 'Sports',
        // image: parseImage(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    }

    return programs
  }
}

// Unfortunately I couldn't determine how these are
// supposed to be formatted. Pointers appreciated!
// function parseImage(item) {
//   const uri = item.broadcastImageUrl

//   return uri ? `https://???/${uri}` : null
// }

function parseStart(item) {
  return dayjs.tz(item.startTime, TIMEZONE)
}

function parseStop(item) {
  return dayjs.tz(item.endTime, TIMEZONE)
}

function parseItems(content) {
  return JSON.parse(content).broadcasts
}
