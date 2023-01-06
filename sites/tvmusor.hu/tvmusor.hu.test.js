// npm run channels:parse -- --config=./sites/tvmusor.hu/tvmusor.hu.config.js --output=./sites/tvmusor.hu/tvmusor.hu.channels.xml
// npx epg-grabber --config=sites/tvmusor.hu/tvmusor.hu.config.js --channels=sites/tvmusor.hu/tvmusor.hu.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./tvmusor.hu.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-11-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '290',
  xmltv_id: 'M4Sport.hu'
}

it('can generate valid url', () => {
  expect(url).toBe('http://www.tvmusor.hu/a/get-events/')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ channel, date })
  expect(result.get('data')).toBe('{"blocks":["290|2022-11-19"]}')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-18T23:30:00.000Z',
    stop: '2022-11-19T00:55:00.000Z',
    title: `Rövidpályás Úszó Országos Bajnokság`,
    category: 'sportműsor',
    description: 'Forma-1 magazin. Hírek, információk, érdekességek a Forma-1 világából.',
    icon: 'http://www.tvmusor.hu/images/events/408/f1e45193930943d9ee29769e0afa902aff0e4a90-better-call-saul.jpg'
  })

  expect(results[1]).toMatchObject({
    start: '2022-11-19T00:55:00.000Z',
    stop: '2022-11-19T01:10:00.000Z',
    title: `Sportlövészet`,
    category: 'sportműsor'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"status":"error","reason":"invalid blocks"}`
  })
  expect(result).toMatchObject([])
})
