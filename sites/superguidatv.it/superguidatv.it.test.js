// npm run channels:parse -- --config=sites/superguidatv.it/superguidatv.it.config.js --output=sites/superguidatv.it/superguidatv.it.channels.xml
// npx epg-grabber --config=sites/superguidatv.it/superguidatv.it.config.js --channels=sites/superguidatv.it/superguidatv.it.channels.xml --output=guide.xml

const { parser, url } = require('./superguidatv.it.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-11', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'virgin-radio/461',
  xmltv_id: 'VirginRadioTV.it'
}

it('can generate valid url', () => {
  expect(url({ channel, date: dayjs.utc().startOf('d') })).toBe(
    'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-virgin-radio/461/'
  )
})

it('can generate valid url for tomorrow', () => {
  expect(url({ channel, date: dayjs.utc().startOf('d').add(1, 'd') })).toBe(
    'https://www.superguidatv.it/programmazione-canale/domani/guida-programmi-tv-virgin-radio/461/'
  )
})

it('can generate valid url for after tomorrow', () => {
  expect(url({ channel, date: dayjs.utc().startOf('d').add(2, 'd') })).toBe(
    'https://www.superguidatv.it/programmazione-canale/dopodomani/guida-programmi-tv-virgin-radio/461/'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-01-11T01:00:00.000Z',
    stop: '2023-01-11T05:00:00.000Z',
    title: `All Nite Rock`,
    category: 'Musica'
  })

  expect(results[13]).toMatchObject({
    start: '2023-01-12T05:00:00.000Z',
    stop: '2023-01-12T05:30:00.000Z',
    title: `Free Rock`,
    category: 'Musica'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
