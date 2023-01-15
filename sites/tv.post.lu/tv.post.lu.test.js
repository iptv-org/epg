// npm run channels:parse -- --config=./sites/tv.post.lu/tv.post.lu.config.js --output=./sites/tv.post.lu/tv.post.lu.channels.xml
// npx epg-grabber --config=sites/tv.post.lu/tv.post.lu.config.js --channels=sites/tv.post.lu/tv.post.lu.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./tv.post.lu.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-16', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '269695d0-8076-11e9-b5ca-f345a2ed0fbe',
  xmltv_id: 'DasErste.de'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    `https://tv.post.lu/api/channels?id=269695d0-8076-11e9-b5ca-f345a2ed0fbe&date=2023-01-16`
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    title: 'Tagesschau',
    description:
      'Das Flaggschiff unter den deutschen Nachrichtensendungen ist gleichzeitig die "dienstälteste" noch bestehende Sendung im deutschen Fernsehen. In bis zu 20 am Tag produzierten Sendungen wird die Komplexität des Weltgeschehens verständlich erklärt und in komprimierter Form über aktuelle politische, wirtschaftliche, soziale, kulturelle, sportliche und sonstige Ereignisse berichtet.',
    category: 'Nachrichten',
    icon: 'https://mp-photos-cdn.azureedge.net/container3cc71e4948ac40ab803c26e0abc2e3e5/original/e6eb49013a822f5c6eb2e7701e69a1f80aa0b947.jpg',
    start: '2023-01-16T00:05:00.000Z',
    stop: '2023-01-16T00:10:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
