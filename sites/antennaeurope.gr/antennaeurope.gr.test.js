const { parser, url } = require('./antennaeurope.gr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-21', 'YYYY-MM-DD').startOf('d')

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://www.antennaeurope.gr/el/tvguide.html?date=2025-01-21')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(16)

  expect(results[0]).toMatchObject({
    start: '2025-01-21T03:45:00.000Z',
    stop: '2025-01-21T07:50:00.000Z',
    title: 'ΚΑΛΗΜΕΡΑ ΕΛΛΑΔΑ'
  })

  expect(results[15]).toMatchObject({
    start: '2025-01-22T01:30:00.000Z',
    stop: '2025-01-22T02:00:00.000Z',
    title: 'ΤΟ ΠΡΩΙΝΟ'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })
  expect(results).toMatchObject([])
})
