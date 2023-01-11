const stream = require('stream')
const csv = require('csv-parser')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'rotana.net',
  days: 2,
  skip: true, // NOTE: there is no program for the current date on the site
  url({ channel, date }) {
    return `https://rotana.net/triAssets/uploads/2020/11/${channel.site_id}.csv`
  },
  request: {
    method: 'POST'
  },
  parser: async function ({ buffer, date }) {
    let programs = []
    const items = await parseItems(buffer, date)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = parseStop(item)
      programs.push({
        title: item['Arabic Event Name'],
        category: item['Genre'],
        description: item['Arabic Extended Description'],
        start: start.toJSON(),
        stop: stop.toJSON()
      })
    })

    return programs
  }
}

function parseIcon(item) {
  return item.pictures && item.pictures.length ? item.pictures[0].href : null
}

function parseStart(item) {
  const time = `${item['Start Date']} ${item['Start Time']}`

  return dayjs.utc(time, 'DD/MM/YYYY HH:mm:ss:00')
}

function parseStop(item) {
  const time = `${item['End Date']} ${item['End Time']}`

  return dayjs.utc(time, 'DD/MM/YYYY HH:mm:ss:00')
}

function parseItems(buffer, date) {
  return new Promise(resolve => {
    let items = []
    const input = new stream.PassThrough()
    input.end(buffer)
    input
      .pipe(csv())
      .on('data', data => items.push(data))
      .on('end', () => {
        items = items.filter(i => i['Start Date'] === date.format('DD/MM/YYYY'))
        resolve(items)
      })
      .on('error', () => {
        resolve([])
      })
  })
}
