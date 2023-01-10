const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

module.exports = {
  site: 'meo.pt',
  days: 2,
  url: `https://www.meo.pt/_layouts/15/Ptsi.Isites.GridTv/GridTvMng.asmx/getProgramsFromChannels`,
  request: {
    method: 'POST',
    data: function ({ channel, date }) {
      return {
        service: 'channelsguide',
        channels: [channel.site_id],
        dateStart: date.format('YYYY-MM-DDT00:00:00-00:00'),
        dateEnd: date.add(1, 'd').format('YYYY-MM-DDT00:00:00-00:00'),
        accountID: ''
      }
    }
  },
  parser({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const start = parseStart(item)
      let stop = parseStop(item)
      if (stop.isBefore(start)) {
        stop = stop.add(1, 'd')
      }
      programs.push({
        title: item.name,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item) {
  return dayjs.tz(`${item.date} ${item.timeIni}`, 'D-M-YYYY HH:mm', 'Europe/Lisbon')
}

function parseStop(item) {
  return dayjs.tz(`${item.date} ${item.timeEnd}`, 'D-M-YYYY HH:mm', 'Europe/Lisbon')
}

function parseItems(content) {
  if (!content) return []
  const data = JSON.parse(content)
  const programs = data?.d?.channels?.[0]?.programs

  return Array.isArray(programs) ? programs : []
}
