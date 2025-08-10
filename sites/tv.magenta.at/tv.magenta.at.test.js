const { parser, url } = require('./tv.magenta.at.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const API_ENDPOINT = 'https://tv-at-prod.yo-digital.com/at-bifrost'

jest.mock('axios')

const date = dayjs.utc('2022-10-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '206969383991',
  xmltv_id: '13thStreet.de',
  lang: 'de'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    `${API_ENDPOINT}/epg/channel/schedules/v2?station_ids=206969383991&date=2022-10-30&hour_offset=0&hour_range=3&natco_code=at`
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_0000.json'))

  axios.get.mockImplementation(url => {
    if (
      url ===
      `${API_ENDPOINT}/epg/channel/schedules/v2?date=2023-11-15&hour_offset=0&hour_range=3&station_ids=206969383991&natco_code=at`
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_0300.json'))
      })
    } else if (
      url ===
      `${API_ENDPOINT}/epg/channel/schedules/v2?date=2023-11-15&hour_offset=3&hour_range=3&station_ids=206969383991&natco_code=at`
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_0600.json'))
      })
    } else if (
      url ===
      `${API_ENDPOINT}/epg/channel/schedules/v2?date=2023-11-15&hour_offset=6&hour_range=3&station_ids=206969383991&natco_code=at`
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_0900.json'))
      })
    } else if (
      url ===
      `${API_ENDPOINT}/epg/channel/schedules/v2?date=2023-11-15&hour_offset=9&hour_range=3&station_ids=206969383991&natco_code=at`
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1200.json'))
      })
    } else if (
      url ===
      `${API_ENDPOINT}/epg/channel/schedules/v2?date=2023-11-15&hour_offset=12&hour_range=3&station_ids=206969383991&natco_code=at`
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1500.json'))
      })
    } else if (
      url ===
      `${API_ENDPOINT}/epg/channel/schedules/v2?date=2023-11-15&hour_offset=15&hour_range=3&station_ids=206969383991&natco_code=at`
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_1800.json'))
      })
    } else if (
      url ===
      `${API_ENDPOINT}/epg/channel/schedules/v2?date=2023-11-15&hour_offset=18&hour_range=3&station_ids=206969383991&natco_code=at`
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_2100.json'))
      })
    } else if (
      url === `${API_ENDPOINT}/details/series/gn.tv-24101298-EP048489190016?natco_code=at`
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
    start: '2023-11-14T23:20:00.000Z',
    stop: '2023-11-15T00:05:00.000Z',
    title: 'So Help Me Todd',
    description:
      'Ava ist 17 und eine geniale Hackerin. Jetzt steht die Teenagerin vor Gericht, weil sie sich illegal Zugang zum Verteidigungsministerium verschafft hat. Todd soll das IT-Genie überwachen.',
    date: '2023',
    category: ['Kriminaldrama'],
    actors: [
      'Marcia Gay Harden',
      'Skylar Astin',
      'Madeline Wise',
      'Tristen J. Winger',
      'Inga Schlingmann',
      'Rosa Evangelina Arredondo',
      'Laila Robins'
    ],
    directors: ['Jay Karas'],
    producers: [
      'Scott Prendergast',
      'Liz Kruger',
      'Elizabeth Klaviter',
      'Dr. Phil McGraw',
      'Jay McGraw',
      'Julia Eisenman',
      'Amy York Rubin'
    ],
    season: 1,
    episode: 15
  })
})

it('can handle empty guide', async () => {
  let results = await parser({ content: '', channel, date })

  expect(results).toMatchObject([])
})
