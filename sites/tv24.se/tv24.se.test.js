// npm run channels:parse -- --config=./sites/tv24.se/tv24.se.config.js --output=./sites/tv24.se/tv24.se.channels.xml
// npx epg-grabber --config=sites/tv24.se/tv24.se.config.js --channels=sites/tv24.se/tv24.se.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tv24.se.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-08-26', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'svt1',
  xmltv_id: 'SVT1.se'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://tv24.se/x/channel/svt1/0/2022-08-26')
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  axios.get.mockImplementation((url, data) => {
    if (url === 'https://tv24.se/x/b/rh7f40-1hkm/0/0') {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program1.json')))
      })
    } else if (url === 'https://tv24.se/x/b/rh9dhc-1hkm/0/0') {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program2.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  let results = await parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-08-26T04:00:00.000Z',
    stop: '2022-08-26T07:10:00.000Z',
    title: 'Morgonstudion',
    icon: 'https://jrsy.tmsimg.com/assets/p14436175_i_h9_ad.jpg',
    description:
      'Dagens viktigaste nyheter och analyser med ständiga uppdateringar. Vi sänder direkt inrikes- och utrikesnyheter inklusive sport, kultur och nöje. Dessutom intervjuer med aktuella gäster. Nyhetssammanfattningar varje kvart med start kl 06.00.',
    actors: ['Carolina Neurath', 'Karin Magnusson', 'Pelle Nilsson', 'Ted Wigren']
  })

  expect(results[33]).toMatchObject({
    start: '2022-08-27T05:20:00.000Z',
    stop: '2022-08-27T05:50:00.000Z',
    title: 'Uppdrag granskning',
    icon: 'https://jrsy.tmsimg.com/assets/p22818697_e_h9_aa.jpg',
    description:
      'När samtliga sex män frias för ännu en skjutning växer vreden inom polisen. Ökningen av skjutningar i Sverige ligger i topp i Europa - och nu är våldsspiralen på väg mot ett nattsvart rekord. Hur blev Sverige landet där mördare går fria?',
    actors: ['Karin Mattisson', 'Ali Fegan'],
    category: ['Dokumentär', 'Samhällsfrågor'],
    season: 23,
    episode: 5,
    sub_title: 'Där mördare går fria'
  })
})

it('can handle empty guide', async () => {
  const result = await parser({ content: '' })
  expect(result).toMatchObject([])
})
