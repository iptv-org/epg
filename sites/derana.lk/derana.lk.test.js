const { parser, url } = require('./derana.lk.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-05-18', 'YYYY-MM-DD').startOf('d')

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://derana.lk/api/schedules/18-05-2025')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(20)
  expect(results[0]).toMatchObject({
    title: 'Dahami Derana',
    image: 'https://derana.lk/storage/uploads/imgs/program/51/20240717062206.jpg',
    start: '2025-05-17T23:05:00.000Z',
    stop: '2025-05-18T00:55:00.000Z'
  })
  expect(results[1]).toMatchObject({
    title: 'Derana Aruna',
    image: 'https://derana.lk/storage/uploads/imgs/program/15/20240613075807.jpg',
    start: '2025-05-18T00:55:00.000Z',
    stop: '2025-05-18T02:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: {
      error: 'An error occurred'
    }
  })

  expect(results).toMatchObject([])
})
