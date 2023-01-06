// npx epg-grabber --config=sites/elcinema.com/elcinema.com.config.js --channels=sites/elcinema.com/elcinema.com.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./elcinema.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-08-28', 'YYYY-MM-DD').startOf('d')
const channelAR = {
  lang: 'ar',
  site_id: '1254',
  xmltv_id: 'OSNSeries.ae'
}
const channelEN = {
  lang: 'en',
  site_id: '1254',
  xmltv_id: 'OSNSeries.ae'
}

it('can generate valid url', () => {
  expect(url({ channel: channelEN })).toBe('https://elcinema.com/en/tvguide/1254/')
})

it('can parse response (en)', () => {
  const contentEN = fs.readFileSync(path.resolve(__dirname, '__data__/content.en.html'))
  const results = parser({ date, channel: channelEN, content: contentEN }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-08-27T14:25:00.000Z',
    stop: '2022-08-27T15:15:00.000Z',
    title: 'Station 19 S5',
    icon: 'https://media.elcinema.com/uploads/_150x200_ec30d1a2251c8edf83334be4860184c74d2534d7ba508a334ad66fa59acc4926.jpg',
    category: 'Series'
  })
})

it('can parse response (ar)', () => {
  const contentAR = fs.readFileSync(path.resolve(__dirname, '__data__/content.ar.html'))
  const results = parser({ date, channel: channelAR, content: contentAR }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-08-27T14:25:00.000Z',
    stop: '2022-08-27T15:15:00.000Z',
    title: 'Station 19 S5',
    icon: 'https://media.elcinema.com/uploads/_150x200_ec30d1a2251c8edf83334be4860184c74d2534d7ba508a334ad66fa59acc4926.jpg',
    category: 'مسلسل'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel: channelEN,
    content: `<!DOCTYPE html><html lang="ar" dir="rtl"><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
