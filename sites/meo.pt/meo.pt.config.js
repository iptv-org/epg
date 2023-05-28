const { DateTime } = require('luxon')

module.exports = {
  site: 'meo.pt',
  days: 2,
  url: `https://authservice.apps.meo.pt/Services/GridTv/GridTvMng.svc/getProgramsFromChannels`,
  request: {
    method: 'POST',
    headers: {
      Origin: 'https://www.meo.pt'
    },
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
      if (stop < start) {
        stop = stop.plus({ days: 1 })
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
  return DateTime.fromFormat(`${item.date} ${item.timeIni}`, 'd-M-yyyy HH:mm', {
    zone: 'Europe/Lisbon'
  }).toUTC()
}

function parseStop(item) {
  return DateTime.fromFormat(`${item.date} ${item.timeEnd}`, 'd-M-yyyy HH:mm', {
    zone: 'Europe/Lisbon'
  }).toUTC()
}

function parseItems(content) {
  if (!content) return []
  const data = JSON.parse(content)
  const programs = data?.d?.channels?.[0]?.programs

  return Array.isArray(programs) ? programs : []
}
