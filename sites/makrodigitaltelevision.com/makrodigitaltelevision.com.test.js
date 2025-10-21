const { parser, url } = require('./makrodigitaltelevision.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-02-16', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '17' }

it('can generate valid url', () => {
  expect(url).toBe('https://makrodigitaltelevision.com/epg.xml')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.xml'))

  const results = parser({ content, channel, date })

  expect(results.length).toBe(8)
  expect(results[0]).toMatchObject({
    title: 'Programación Infantil',
    start: '2025-02-16T13:00:00.000Z',
    stop: '2025-02-16T17:00:00.000Z'
  })
  expect(results[7]).toMatchObject({
    title: 'Comunicación Cristiana',
    start: '2025-02-16T23:30:00.000Z',
    stop: '2025-02-17T00:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
