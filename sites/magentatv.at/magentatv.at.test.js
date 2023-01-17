// npm run channels:parse -- --config=./sites/magentatv.at/magentatv.at.config.js --output=./sites/magentatv.at/magentatv.at.channels.xml
// npx epg-grabber --config=sites/magentatv.at/magentatv.at.config.js --channels=sites/magentatv.at/magentatv.at.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./magentatv.at.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const API_STATIC_ENDPOINT = 'https://static.spark.magentatv.at/deu/web/epg-service-lite/at'
const API_PROD_ENDPOINT = 'https://prod.spark.magentatv.at/deu/web/linear-service/v2'

jest.mock('axios')

const date = dayjs.utc('2022-10-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '13TH_STREET_HD',
  xmltv_id: '13thStreet.de',
  lang: 'de'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(`${API_STATIC_ENDPOINT}/de/events/segments/20221030000000`)
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_0000.json'))

  axios.get.mockImplementation(url => {
    if (url === `${API_STATIC_ENDPOINT}/de/events/segments/20221030060000`) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_0600.json'))
      })
    } else if (url === `${API_STATIC_ENDPOINT}/de/events/segments/20221030120000`) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1200.json'))
      })
    } else if (url === `${API_STATIC_ENDPOINT}/de/events/segments/20221030180000`) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1800.json'))
      })
    } else if (
      url ===
      `${API_PROD_ENDPOINT}/replayEvent/crid:~~2F~~2Fgn.tv~~2F2236391~~2FEP019388320252,imi:af4af994f29354e64878101c0612b17999d0c1a3?returnLinearContent=true`
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
    start: '2022-10-29T23:55:00.000Z',
    stop: '2022-10-30T01:40:00.000Z',
    title: 'Law & Order: Special Victims Unit',
    sub_title: 'Mutterinstinkt',
    description:
      'Patty Branson wird von einem Jungen in einem Park angegriffen und von diesem verfolgt. Der Junge wurde von Michelle Osborne engagiert, die vorgibt, die leibliche Mutter des Mädchens zu sein. Doch ist dies tatsächlich die Wahrheit?',
    date: '2004',
    category: ['Drama-Serie', 'Krimi Drama', 'Action', 'Thriller'],
    actors: [
      'Christopher Meloni',
      'Mariska Hargitay',
      'Richard Belzer',
      'Dann Florek',
      'Ice-T',
      'BD Wong',
      'Diane Neal',
      'Tamara Tunie',
      'Abigail Breslin',
      'Lea Thompson'
    ],
    directors: ['Arthur W. Forney'],
    producers: ['Dick Wolf', 'Ted Kotcheff', 'Neal Baer'],
    season: 6,
    episode: 1
  })
})

it('can handle empty guide', async () => {
  let results = await parser({ content: ``, channel, date })

  expect(results).toMatchObject([])
})
