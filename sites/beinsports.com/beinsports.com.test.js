const { parser, url } = require('./beinsports.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-10-22T00:00:00.000', '"YYYY-MM-DDTHH:mm:ss.SSS').startOf('d')
const channel = { site_id: 'C244C48D-3B54-406A-94C9-D63B16318267', xmltv_id: 'beINSportsUSA.us' }

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://www.beinsports.com/api/opta/tv-event?&startBefore=2023-10-23T00:00:00.000Z&endAfter=2023-10-22T00:00:00.000Z&channelIds=C244C48D-3B54-406A-94C9-D63B16318267'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2023-10-20T23:30:00.000Z',
      stop: '2023-10-21T01:00:00.000Z',
      title: 'Tokyo Day 5 QF 2',
      description: 'Exclusive coverage of the 2023 ATP Tour on beIN SPORTS'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '[]'
  })
  expect(result).toMatchObject([])
})
