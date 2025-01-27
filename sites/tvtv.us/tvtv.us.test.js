const { parser, url } = require('./tvtv.us.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-30', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '20373' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.tvtv.us/api/v1/lineup/USA-NY71652-X/grid/2025-01-30T00:00:00.000Z/2025-01-31T00:00:00.000Z/20373'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(33)
  expect(results[0]).toMatchObject({
    start: '2025-01-30T00:00:00.000Z',
    stop: '2025-01-30T00:30:00.000Z',
    title: 'NY Sports Nation Nightly',
    subtitle: null
  })
  expect(results[1]).toMatchObject({
    start: '2025-01-30T00:30:00.000Z',
    stop: '2025-01-30T01:00:00.000Z',
    title: 'The Big Bang Theory',
    subtitle: 'The Bow Tie Asymmetry'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: '[]'
  })
  expect(results).toMatchObject([])
})
