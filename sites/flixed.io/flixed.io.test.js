// npx epg-grabber --config=sites/flixed.io/flixed.io.config.js --channels=sites/flixed.io/flixed.io.channels.xml --output=guide.xml --days=1

const { parser, url } = require('./flixed.io.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '108970',
  xmltv_id: 'VSiN.us'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    `https://tv-guide.vercel.app/api/stationAirings?stationId=108970&startDateTime=2023-01-19T00:00:00.000Z`
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-01-19T05:00:00.000Z',
    stop: '2023-01-19T06:00:00.000Z',
    title: 'The Greg Peterson Experience',
    category: 'Sports non-event',
    icon: 'https://adma.tmsimg.com/assets/assets/p20628892_b_v13_aa.jpg?w=270&h=360',
    description: 'A different kind of sports betting.'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: `[]`
  })

  expect(results).toMatchObject([])
})
