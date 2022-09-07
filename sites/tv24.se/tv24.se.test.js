// npm run channels:parse -- --config=./sites/tv24.se/tv24.se.config.js --output=./sites/tv24.se/tv24.se_se.channels.xml
// npx epg-grabber --config=sites/tv24.se/tv24.se.config.js --channels=sites/tv24.se/tv24.se_se.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tv24.se.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-08-26', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'svt1',
  xmltv_id: 'SVT1.se'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://tv24.se/x/channel/svt1/0/2022-08-26')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-08-26T04:00:00.000Z',
    stop: '2022-08-26T07:10:00.000Z',
    title: 'Morgonstudion',
    description:
      'Dagens viktigaste nyheter och analyser med ständiga uppdateringar. Vi sänder direkt inrikes- och utrikesnyheter inklusive sport, kultur och nöje. Dessutom intervjuer med aktuella gäster. Nyhetssammanfattningar varje kvart med start kl 06.00.'
  })

  expect(results[33]).toMatchObject({
    start: '2022-08-27T05:20:00.000Z',
    stop: '2022-08-27T05:50:00.000Z',
    title: 'Uppdrag granskning',
    description:
      'När samtliga sex män frias för ännu en skjutning växer vreden inom polisen. Ökningen av skjutningar i Sverige ligger i topp i Europa - och nu är våldsspiralen på väg mot ett nattsvart rekord. Hur blev Sverige landet där mördare går fria?'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: ''
  })
  expect(result).toMatchObject([])
})
