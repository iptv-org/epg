const { parser, url } = require('./snrt.ma.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const fs = require('fs')
const path = require('path')

dayjs.extend(utc)
dayjs.extend(timezone)

const date = dayjs.utc('2025-01-13', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '4075', xmltv_id: 'Tamazight.ma', lang: 'ar' }

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.snrt.ma/ar/node/4075')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ date, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(27)
  expect(results[0]).toMatchObject({
    start: '2025-01-12T23:15:00.000Z',
    stop: '2025-01-12T23:30:00.000Z',
    title: 'الموعد الرياضي'
  })
  expect(results[26]).toMatchObject({
    start: '2025-01-13T21:30:00.000Z',
    stop: '2025-01-13T23:00:00.000Z',
    title: 'سهرة خاصة براس السنة الامازيغية',
    category: 'ترفيه'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel: channel,
    content: '<!DOCTYPE html><html lang="ar" dir="rtl"><head></head><body></body></html>'
  })
  expect(result).toMatchObject([])
})
