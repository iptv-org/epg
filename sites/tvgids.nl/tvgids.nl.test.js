// npm run channels:parse -- --config=./sites/tvgids.nl/tvgids.nl.config.js --output=./sites/tvgids.nl/tvgids.nl.channels.xml
// npx epg-grabber --config=sites/tvgids.nl/tvgids.nl.config.js --channels=sites/tvgids.nl/tvgids.nl.channels.xml --output=guide.xml

const { parser, url } = require('./tvgids.nl.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-06-13', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'npo1',
  xmltv_id: 'NPO1.nl'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe('https://www.tvgids.nl/gids/13-06-2023/npo1')
})

it('can generate valid url for today', () => {
  const today = dayjs().startOf('d')

  expect(url({ date: today, channel })).toBe('https://www.tvgids.nl/gids/npo1')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-06-12T21:57:00.000Z',
    stop: '2023-06-12T22:58:00.000Z',
    title: 'Op1',
    icon: 'https://tvgidsassets.nl/v301/upload/o/carrousel/op1-451542641.jpg',
    description: "Talkshow met wisselende presentatieduo's, live vanuit Amsterdam."
  })

  expect(results[61]).toMatchObject({
    start: '2023-06-14T00:18:00.000Z',
    stop: '2023-06-14T00:48:00.000Z',
    title: 'NOS Journaal',
    icon: 'https://tvgidsassets.nl/v301/upload/n/carrousel/nos-journaal-452818771.jpg',
    description:
      'Met het laatste nieuws, gebeurtenissen van nationaal en internationaal belang en de weersverwachting voor vandaag.'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: ``,
    date
  })
  expect(result).toMatchObject([])
})
