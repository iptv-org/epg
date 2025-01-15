const { parser, url } = require('./tvmustra.hu.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'M1HD',
  xmltv_id: 'M1HD.hu'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.tvmustra.hu/tvmusor/M1HD/2025-01-17')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(98)
  expect(results[0]).toMatchObject({
    start: '2025-01-17T05:00:00.000Z',
    stop: '2025-01-17T05:30:00.000Z',
    title: 'HÍRADÓ'
  })
  expect(results[97]).toMatchObject({
    start: '2025-01-18T04:00:00.000Z',
    stop: '2025-01-18T04:30:00.000Z',
    title: 'Ma éjszaka'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    content: ''
  })
  expect(results).toMatchObject([])
})
