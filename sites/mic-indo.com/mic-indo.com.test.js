const { parser, url } = require('./mic-indo.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-12', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'mic-indo', xmltv_id: 'MusicInformationChannel.id@SD' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://micindo.com/api/public/schedule')
})

it('can parse response', () => {
  const content =
    '[{"title":"Program 1","start":"2025-01-12T00:00:00.000Z","stop":"2025-01-12T00:30:00.000Z"},{"title":"Program 2","start":"2025-01-12T00:30:00.000Z","stop":"2025-01-12T01:00:00.000Z"}]'

  const results = parser({ content })

  expect(results.length).toBe(2)
  expect(results[0]).toMatchObject({
    title: 'MIC CHART 2024',
    description: 'Program mingguan Mic Chart 2024',
    start: '2026-09-25T17:00:00.000Z',
    stop: '2026-09-25T17:30:00.000Z'
  })
  expect(results[1]).toMatchObject({
    title: 'SABTU: MIC VIDEO LIRIK 6 (00:00 - 01:00)',
    description: 'Memutarkan video lirik musisi-musisi Indonesia',
    start: '2026-09-25T17:30:01.000Z',
    stop: '2026-09-25T18:30:00.000Z'
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