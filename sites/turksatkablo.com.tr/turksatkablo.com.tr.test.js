const { parser, url } = require('./turksatkablo.com.tr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-05-30', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '1908' }

it('can generate valid url', () => {
  const result = url({ date })

  expect(result).toBe('https://www.turksatkablo.com.tr/userUpload/EPG/30.json?_=1748563200000')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(14)
  expect(results[0]).toMatchObject({
    title: '-',
    start: '2025-05-29T21:00:00.000Z',
    stop: '2025-05-29T22:30:00.000Z'
  })
  expect(results[1]).toMatchObject({
    title: 'Şeytanın Evi',
    start: '2025-05-29T22:30:00.000Z',
    stop: '2025-05-30T00:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const result = parser({
    date,
    channel,
    content
  })
  expect(result).toMatchObject([])
})
