const { parser, url } = require('./telebilbao.es.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-16', 'YYYY-MM-DD').startOf('d')

it('can generate valid url', () => {
  expect(url).toBe('https://www.telebilbao.es/programacion-2/')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(50)
  expect(results[0]).toMatchObject({
    start: '2025-01-16T06:00:00.000Z',
    stop: '2025-01-16T06:30:00.000Z',
    title: 'BAI HORIXE'
  })
  expect(results[49]).toMatchObject({
    start: '2025-01-17T07:30:00.000Z',
    stop: '2025-01-17T08:00:00.000Z',
    title: 'LA KAPITAL'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  })
  expect(results).toMatchObject([])
})
