const { parser, url, request } = require('./webtv.sk.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-02-17', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'golf_channel' }

it('can generate valid url', () => {
  expect(url).toBe('https://api.webtv.sk/epg/channel')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'content-type': 'application/json'
  })
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    channel_id: 'golf_channel',
    date: '2026-02-17T00:00:00.000Z'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(12)
  expect(results[0]).toMatchObject({
    title: 'Qatar Masters',
    subtitle: '',
    description: 'Finálové kolo turnaje DP World Tour. Doha, Qatar., (šport)',
    categories: ['šport'],
    start: '2026-02-16T23:00:00.000Z',
    stop: '2026-02-17T04:00:00.000Z'
  })
  expect(results[11]).toMatchObject({
    title: 'The Golf Fix',
    subtitle: '',
    description:
      'Jak v golfu pracovat se spinem. Spin neboli zpětná rotace míčku je jedním z nejdůležitějších faktorů v golfu. Jak s ním pracovat a jak ho mít pod kontrolou vás v dalším pokračování pořadu Golf Fix naučí Devan Bonebrake.., (šport)',
    categories: ['šport'],
    start: '2026-02-17T22:30:00.000Z',
    stop: '2026-02-17T23:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
