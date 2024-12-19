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

const date = dayjs.utc('2024-12-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'NL_000001_019401',
  xmltv_id: 'NPO1.nl',
  lang: 'nl'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20241217000000'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_0000.json'))

  axios.get.mockImplementation(url => {
    if (
      url ===
      'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20241217060000'
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_0600.json'))
      })
    } else if (
      url ===
      'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20241217120000'
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1200.json'))
      })
    } else if (
      url ===
      'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20241217180000'
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1800.json'))
      })
    } else if (
      url ===
      'https://prod.spark.ziggogo.tv/eng/web/linear-service/v2/replayEvent/crid:~~2F~~2Fgn.tv~~2F817615~~2FSH010806510000~~2F333033007,imi:b6a840f6a097abe22220e1e29a2310c343a3b519?returnLinearContent=true&language=nl'
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
    start: '2024-12-16T23:40:00.000Z',
    stop: '2024-12-17T00:10:00.000Z',
    title: 'NOS Journaal',
    description:
      'Met het laatste nieuws, gebeurtenissen van nationaal en internationaal belang en de weersverwachting voor de avond en komende dagen.',
    category: ['Nieuws'],
    actors: [
      "Afke Boven",
      "Annechien Steenhuizen",
      "Iris De Graaf",
      "Jeroen Overbeek",
      "Malou Petter",
      "Rob Trip",
      "Saïda Maggé",
      "Jeroen Tjepkema",
      "Mark Visser",
      "Simone Weimans"
    ]
  })
})

it('can handle empty guide', async () => {
  let results = await parser({ content: '', channel, date })

  expect(results).toMatchObject([])
})
