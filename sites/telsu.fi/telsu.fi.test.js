// npm run channels:parse -- --config=./sites/telsu.fi/telsu.fi.config.js --output=./sites/telsu.fi/telsu.fi.channels.xml
// npx epg-grabber --config=sites/telsu.fi/telsu.fi.config.js --channels=sites/telsu.fi/telsu.fi.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./telsu.fi.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-10-29', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'yle1',
  xmltv_id: 'YleTV1.fi'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe('https://www.telsu.fi/20221029/yle1')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-10-29T04:00:00.000Z',
    stop: '2022-10-29T04:28:00.000Z',
    title: 'Antiikkikaksintaistelu',
    description:
      'Kausi 6, osa 5/12. Antiikkikaksintaistelu jatkuu Løkkenissä. Uusi taistelupari Rikke Fog ja Lasse Franck saavat kumpikin 10 000 kruunua ja viisi tuntia aikaa ostaa alueelta hyvää tavaraa halvalla.',
    icon: 'https://www.telsu.fi/s/antiikkikaksintaistelu_11713730.jpg'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html')),
    date
  })
  expect(result).toMatchObject([])
})
