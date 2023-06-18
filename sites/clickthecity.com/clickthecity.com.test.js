// npm run channels:parse -- --config=./sites/clickthecity.com/clickthecity.com.config.js --output=./sites/clickthecity.com/clickthecity.com.channels.xml
// npx epg-grabber --config=sites/clickthecity.com/clickthecity.com.config.js --channels=sites/clickthecity.com/clickthecity.com.channels.xml --output=guide.xml

const { parser, url, request } = require('./clickthecity.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-06-12', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '5',
  xmltv_id: 'TV5.ph'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.clickthecity.com/tv/channels/?netid=5')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'content-type': 'application/x-www-form-urlencoded'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ date })
  expect(result.get('optDate')).toBe('2023-06-12')
  expect(result.get('optTime')).toBe('00:00:00')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(20)

  expect(results[0]).toMatchObject({
    start: '2023-06-11T21:00:00.000Z',
    stop: '2023-06-11T22:00:00.000Z',
    title: `Word Of God`
  })

  expect(results[19]).toMatchObject({
    start: '2023-06-12T15:30:00.000Z',
    stop: '2023-06-12T16:00:00.000Z',
    title: `La Suerte De Loli`
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html class="html" lang="en-US" prefix="og: https://ogp.me/ns#"><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
