const { parser, url } = require('./tv.boxbg.net.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-08-13', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'БНТ1/29' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://tv.boxbg.net/channel/БНТ1/29?day=13082025')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(37)
  expect(results[0]).toMatchObject({
    title: '65 в ефир - /п/',
    categories: [],
    start: '2025-08-12T21:25:00.000Z',
    stop: '2025-08-12T21:55:00.000Z'
  })
  expect(results[36]).toMatchObject({
    title: 'Шетланд 3 - тв филм /5 епизод/ (14)',
    categories: ['Сериал'],
    start: '2025-08-13T20:25:00.000Z',
    stop: '2025-08-13T21:25:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const results = parser({ content })

  expect(results).toMatchObject([])
})
