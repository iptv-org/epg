// npm run channels:parse -- --config=./sites/mon-programme-tv.be/mon-programme-tv.be.config.js --output=./sites/mon-programme-tv.be/mon-programme-tv.be.channels.xml
// npx epg-grabber --config=sites/mon-programme-tv.be/mon-programme-tv.be.config.js --channels=sites/mon-programme-tv.be/mon-programme-tv.be.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./mon-programme-tv.be.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1873/programme-television-ln24',
  xmltv_id: 'LN24.be'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://www.mon-programme-tv.be/chaine/19012023/1873/programme-television-ln24.html'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-01-19T05:30:00.000Z',
    stop: '2023-01-19T05:55:00.000Z',
    title: 'LN Matin',
    category: 'Magazine Actualité',
    icon: 'https://dnsmptv-img.pragma-consult.be/imgs/picto/132/Reportage_1.jpg'
  })

  expect(results[1]).toMatchObject({
    start: '2023-01-19T05:55:00.000Z',
    stop: '2023-01-19T06:00:00.000Z',
    title: 'Météo',
    category: 'Météo',
    icon: 'https://dnsmptv-img.pragma-consult.be/imgs/picto/132/Meteo.jpg'
  })

  expect(results[8]).toMatchObject({
    start: '2023-01-19T08:00:00.000Z',
    stop: '2023-01-19T08:05:00.000Z',
    title: 'Le journal',
    description: "L'information de la mi-journée avec des JT...",
    category: 'Journal',
    icon: 'https://dnsmptv-img.pragma-consult.be/imgs/picto/132/journal.jpg'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html')),
    date
  })

  expect(results).toMatchObject([])
})
