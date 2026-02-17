const { parser, url } = require('./tvguide.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2025-07-29', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '9200004683',
  xmltv_id: 'NationalGeographicWild.us@East'
}

it('can generate valid url', async () => {
  axios.get.mockImplementation(url => {
    if (url === 'https://www.tvguide.com/listings/') {
      return Promise.resolve({
        data: fs.readFileSync(path.join(__dirname, '__data__', 'content.html'), 'utf8')
      })
    }
    throw new Error(`Unexpected URL: ${url}`)
  })

  const result = await url({ date })
  expect(result).toBe(
    'https://backend.tvguide.com/tvschedules/tvguide/9100001138/web?start=1753747200&duration=240&apiKey=DI9elXhZ3bU6ujsA2gXEKOANyncXGUGc'
  )
})

it('can parse response', async () => {
  const content = JSON.parse(fs.readFileSync(path.join(__dirname, '__data__', 'content.json'), 'utf-8'))

  axios.get.mockImplementation(url => {
    if (
      url ===
      'https://backend.tvguide.com/tvschedules/tvguide/programdetails/9000058285/web'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.join(__dirname, '__data__', 'program.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  let results = await parser({ content, date, channel, fetchSegments: false })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2025-07-29T00:00:00.000Z',
    stop: '2025-07-29T01:00:00.000Z',
    title: 'Secrets of the Zoo: North Carolina',
    sub_title: 'Chimp Off the Old Block',
    description:
      'Chimps living at the North Carolina Zoo, a zoo located in the center of North Carolina that serves as the world\'s largest natural habitat zoo, as well as one of two state-supported zoos, are cared for',
    categories: ['Reality'],
    season: 1,
    episode: 1,
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    date,
    channel,
    content: fs.readFileSync(path.join(__dirname, '__data__', 'no-content.json'))
  })
  expect(results).toMatchObject([])
})
