// npm run channels:parse -- --config=./sites/tvgids.nl/tvgids.nl.config.js --output=./sites/tvgids.nl/tvgids.nl.channels.xml
// npx epg-grabber --config=sites/tvgids.nl/tvgids.nl.config.js --channels=sites/tvgids.nl/tvgids.nl.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tvgids.nl.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-11-18', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'eurosport1',
  xmltv_id: 'Eurosport1Netherlands.nl'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe('https://www.tvgids.nl/gids/18-11-2022/eurosport1')
})

it('can generate valid url for today', () => {
  const today = dayjs.utc().startOf('d')

  expect(url({ date: today, channel })).toBe('https://www.tvgids.nl/gids/eurosport1')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-17T22:30:00.000Z',
    stop: '2022-11-17T23:30:00.000Z',
    title: 'Autosport: 8 uur van Bahrein',
    description: 'Verslag van de 8 uur van Bahrein, gereden op het Bahrain International Circuit.'
  })

  expect(results[1]).toMatchObject({
    start: '2022-11-17T23:30:00.000Z',
    stop: '2022-11-18T00:30:00.000Z',
    title: 'Powerlifting: Wereldkampioenschap Viborg',
    description: 'Verslag van de krachtsport powerlifting.',
    icon: 'https://tvgidsassets.nl/v270/upload/p/klein/powerlifting-wereldkampioenschap-viborg-418877211.jpg'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: ``,
    date
  })
  expect(result).toMatchObject([])
})
