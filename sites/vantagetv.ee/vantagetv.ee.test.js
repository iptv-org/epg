const { parser, url } = require('./vantagetv.ee.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-02-05', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'vrock' }

it('can generate valid url', () => {
  expect(url).toBe('http://vantagetv.ee/epg.xml')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.xml'))

  const results = parser({ content, channel, date })

  expect(results.length).toBe(3)
  expect(results[0]).toMatchObject({
    title: 'Breakfast with Vantage Rock',
    description: 'Get ready for your day with Vantage Rock',
    start: '2026-02-05T04:00:00.000Z',
    stop: '2026-02-05T08:00:00.000Z'
  })
  expect(results[2]).toMatchObject({
    title: 'Rock All Night',
    description: 'It might be late, but that&apos;s no reason to stop!',
    start: '2026-02-05T22:00:00.000Z',
    stop: '2026-02-06T04:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
