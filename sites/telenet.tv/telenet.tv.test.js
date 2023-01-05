// npm run channels:parse -- --config=./sites/telenet.tv/telenet.tv.config.js --output=./sites/telenet.tv/telenet.tv.channels.xml
// npx epg-grabber --config=sites/telenet.tv/telenet.tv.config.js --channels=sites/telenet.tv/telenet.tv.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./telenet.tv.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const API_STATIC_ENDPOINT = 'https://static.spark.telenet.tv/eng/web/epg-service-lite/be'
const API_PROD_ENDPOINT = 'https://prod.spark.telenet.tv/eng/web/linear-service/v2'

jest.mock('axios')

const date = dayjs.utc('2022-10-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'outtv',
  xmltv_id: 'OutTV.nl',
  lang: 'nl'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(`${API_STATIC_ENDPOINT}/nl/events/segments/20221030000000`)
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_0000.json'))

  axios.get.mockImplementation(url => {
    if (url === `${API_STATIC_ENDPOINT}/nl/events/segments/20221030060000`) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_0600.json'))
      })
    } else if (url === `${API_STATIC_ENDPOINT}/nl/events/segments/20221030120000`) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1200.json'))
      })
    } else if (url === `${API_STATIC_ENDPOINT}/nl/events/segments/20221030180000`) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1800.json'))
      })
    } else if (
      url ===
      `${API_PROD_ENDPOINT}/replayEvent/crid:~~2F~~2Fgn.tv~~2F2459095~~2FEP036477800004,imi:0a2f4207b03c16c70b7fb3be8e07881aafe44106?returnLinearContent=true&language=nl`
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  let results = await parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-10-29T23:56:00.000Z',
    stop: '2022-10-30T01:44:00.000Z',
    title: 'Queer as Folk USA',
    description:
      "Justin belandt in de gevangenis, Brian en Brandon banen zich een weg door de lijst, Ben treurt, Melanie en Lindsay proberen een interne scheiding en Emmett's stalker onthult zichzelf.",
    category: ['Dramaserie', 'LHBTI'],
    actors: [
      'Gale Harold',
      'Hal Sparks',
      'Randy Harrison',
      'Peter Paige',
      'Scott Lowell',
      'Thea Gill',
      'Michelle Clunie',
      'Sharon Gless'
    ],
    season: 5,
    episode: 8
  })
})

it('can handle empty guide', async () => {
  let results = await parser({ content: ``, channel, date })

  expect(results).toMatchObject([])
})
