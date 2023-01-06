// npm run channels:parse -- --config=./sites/ziggogo.tv/ziggogo.tv.config.js --output=./sites/ziggogo.tv/ziggogo.tv.channels.xml
// npx epg-grabber --config=sites/ziggogo.tv/ziggogo.tv.config.js --channels=sites/ziggogo.tv/ziggogo.tv.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./ziggogo.tv.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-10-28', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'NL_000001_019401',
  xmltv_id: 'NPO1.nl',
  lang: 'nl'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/nl/events/segments/20221028000000'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_0000.json'))

  axios.get.mockImplementation(url => {
    if (
      url ===
      'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/nl/events/segments/20221028060000'
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_0600.json'))
      })
    } else if (
      url ===
      'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/nl/events/segments/20221028120000'
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1200.json'))
      })
    } else if (
      url ===
      'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/nl/events/segments/20221028180000'
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1800.json'))
      })
    } else if (
      url ===
      'https://prod.spark.ziggogo.tv/eng/web/linear-service/v2/replayEvent/crid:~~2F~~2Fgn.tv~~2F817615~~2FSH010806510000~~2F144222201,imi:ea187e3432c4a98b5ea45bcc5525c7a93c77b47b?returnLinearContent=true&language=nl'
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
    start: '2022-10-27T23:40:00.000Z',
    stop: '2022-10-28T00:07:00.000Z',
    title: 'NOS Journaal',
    description:
      'Met het laatste nieuws, gebeurtenissen van nationaal en internationaal belang en de weersverwachting voor de avond en komende dagen.',
    category: ['Nieuws'],
    actors: [
      'Malou Petter',
      'Mark Visser',
      'Rob Trip',
      'Jeroen Overbeek',
      'Simone Weimans',
      'Annechien Steenhuizen',
      'Jeroen Tjepkema',
      'Saïda Maggé',
      'Winfried Baijens'
    ]
  })
})

it('can handle empty guide', async () => {
  let results = await parser({ content: ``, channel, date })

  expect(results).toMatchObject([])
})
