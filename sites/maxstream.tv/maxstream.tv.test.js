const { parser, url } = require('./maxstream.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const date = dayjs.utc('2026-07-04').startOf('d')
const channel = { site_id: '0_meap4fi2' }

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://api.maxstream.tv/v1/videos/0_meap4fi2/schedule')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json')).toString()
  const results = parser({ content, channel, date })
    .map(p => {
      p.start = p.start.toJSON()
      p.stop = p.stop.toJSON()
      return p
    })

  expect(results.length).toBe(30)
  expect(results[0]).toMatchObject({
    title: 'Dirty Money S1 - Eps. 10',
    description:
      'Serial dokumenter yang mengungkap skandal keuangan terbesar di dunia, membongkar praktik curang para korporasi dan dampaknya pada masyarakat luas.',
    start: '2026-07-03T17:50:00.000Z',
    stop: '2026-07-03T18:20:00.000Z',
    season: 1,
    episode: 10
  })
  expect(results[29]).toMatchObject({
    title: 'He\'s Just Not That Into You',
    description:
      'Komedi romantis tentang lika-liku pencarian cinta dan salah paham dalam membaca tanda pasangan.',
    start: '2026-07-04T09:15:00.000Z',
    stop: '2026-07-04T11:25:00.000Z',
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: '',
    channel
  })

  expect(results).toMatchObject([])
})
