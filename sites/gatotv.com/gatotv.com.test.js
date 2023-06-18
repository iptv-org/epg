// npm run channels:parse -- --config=./sites/gatotv.com/gatotv.com.config.js --output=./sites/gatotv.com/gatotv.com.channels.xml
// npx epg-grabber --config=sites/gatotv.com/gatotv.com.config.js --channels=sites/gatotv.com/gatotv.com.channels.xml --output=guide.xml

const { parser, url, request } = require('./gatotv.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

let date = dayjs.utc('2023-06-13', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'm_0',
  xmltv_id: '0porMovistarPlus.es'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.gatotv.com/canal/m_0/2023-06-13')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_0.html'), 'utf8')
  const results = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-06-13T04:30:00.000Z',
    stop: '2023-06-13T05:32:00.000Z',
    title: 'Supergarcía'
  })

  expect(results[1]).toMatchObject({
    start: '2023-06-13T05:32:00.000Z',
    stop: '2023-06-13T06:59:00.000Z',
    title: 'La resistencia'
  })

  expect(results[25]).toMatchObject({
    start: '2023-06-14T04:46:00.000Z',
    stop: '2023-06-14T05:00:00.000Z',
    title: 'Una familia absolutamente normal'
  })
})

it('can parse response when the guide starts from midnight', () => {
  date = date.add(1, 'd')
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_1.html'), 'utf8')
  const results = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-06-14T05:00:00.000Z',
    stop: '2023-06-14T05:32:00.000Z',
    title: 'Ilustres Ignorantes'
  })

  expect(results[26]).toMatchObject({
    start: '2023-06-15T04:30:00.000Z',
    stop: '2023-06-15T05:30:00.000Z',
    title: 'Showriano'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })

  expect(results).toMatchObject([])
})
