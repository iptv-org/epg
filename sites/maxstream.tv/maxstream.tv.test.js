const { parser, url } = require('./maxstream.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const date = dayjs.utc('2026-05-02').startOf('d')
const channel = { site_id: '0_86sal99e' }

it('can generate valid url', () => {
  expect(url({ channel })).toBe(
    'https://vmp.maxstream.tv/api/v3/videos/0_86sal99e/schedules'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
    .toString()
  const results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(49)
  expect(results[0]).toMatchObject({
    title: 'I\'ll Become A Villainess Who Goes Down In History - Eps.12',
    description:
      'Seorang gadis bereinkarnasi sebagai tokoh antagonis dalam novel fantasi. Ia bertekad menjadi villain sejati, namun pilihan tindakannya justru mengubah jalan cerita dan memengaruhi hubungan dengan karakter lain.',
    start: '2026-05-01T16:30:00.000Z',
    stop: '2026-05-01T17:00:00.000Z',
    episode: 12
  })
  expect(results[46]).toMatchObject({
    title: 'Haikyu!! 4Th Season - Eps.22',
    description:
      'Karasuno melaju ke turnamen nasional dan menghadapi tim-tim elit dengan gaya bermain berbeda. Latihan intens dan strategi baru menguji kemampuan Hinata serta rekan-rekannya dalam menghadapi tekanan pertandingan besar.',
    start: '2026-05-02T15:26:00.000Z',
    stop: '2026-05-02T16:00:00.000Z',
    season: 4,
    episode: 22
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: '',
    channel
  })

  expect(results).toMatchObject([])
})
