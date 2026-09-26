const { parser, url } = require('./mic-indo.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const fs = require('fs')
const path = require('path')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-12', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'mic-indo', xmltv_id: 'MusicInformationChannel.id@SD' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://micindo.com/api/public/schedule')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')

  const results = parser({ content })

  expect(results.length).toBe(14)
  expect(results[0]).toMatchObject({
    title: 'MIC CHART 2024',
    description: 'Program mingguan Mic Chart 2024',
    start: dayjs.tz('2026-09-26T00:00:00', 'Asia/Jakarta'),
    stop: dayjs.tz('2026-09-26T00:30:00', 'Asia/Jakarta')
  })
  expect(results[1]).toMatchObject({
    title: 'SABTU: MIC VIDEO LIRIK 6 (00:00 - 01:00)',
    description: 'Memutarkan video lirik musisi-musisi Indonesia',
    start: dayjs.tz('2026-09-26T00:30:01', 'Asia/Jakarta'),
    stop: dayjs.tz('2026-09-26T01:30:00', 'Asia/Jakarta')
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: ''
  })

  expect(result).toMatchObject([])
})