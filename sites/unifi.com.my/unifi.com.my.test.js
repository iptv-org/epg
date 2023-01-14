// npx epg-grabber --config=sites/unifi.com.my/unifi.com.my.config.js --channels=sites/unifi.com.my/unifi.com.my.channels.xml --output=guide.xml --days=2 --timeout=30000

const { parser, url, request } = require('./unifi.com.my.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-13', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '20000009',
  xmltv_id: 'TV1.my'
}

it('can generate valid url', () => {
  expect(url).toBe(`https://unifi.com.my/tv/api/tv`)
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'x-requested-with': 'XMLHttpRequest'
  })
})

it('can generate valid request data', () => {
  const data = request.data({ date })

  expect(data.get('date')).toBe('2023-01-13')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content, date, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    title: 'Berita Tengah Malam',
    start: '2023-01-12T16:00:00.000Z',
    stop: '2023-01-12T16:30:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '', channel })

  expect(results).toMatchObject([])
})
