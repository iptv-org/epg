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

const date = dayjs.utc('2025-01-12', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '9200018514',
  xmltv_id: 'CBSEast.us'
}

axios.get.mockImplementation(url => {
  const result = {}
  const urls = {
    'https://www.tvguide.com/listings/':
      'content.html',
    'https://backend.tvguide.com/tvschedules/tvguide/9100001138/web?start=1736640000&duration=240&apiKey=DI9elXhZ3bU6ujsA2gXEKOANyncXGUGc':
      'content1.json',
    'https://backend.tvguide.com/tvschedules/tvguide/9100001138/web?start=1736654400&duration=240&apiKey=DI9elXhZ3bU6ujsA2gXEKOANyncXGUGc':
      'content2.json',
    'https://backend.tvguide.com/tvschedules/tvguide/programdetails/9000351140/web':
      'program1.json',
    'https://backend.tvguide.com/tvschedules/tvguide/programdetails/9000000408/web':
      'program2.json',
  }
  if (urls[url] !== undefined) {
    result.data = fs.readFileSync(path.join(__dirname, '__data__', urls[url])).toString()
    if (!urls[url].startsWith('content1') && !urls[url].endsWith('.html')) {
      result.data = JSON.parse(result.data)
    }
  }

  return Promise.resolve(result)
})

it('can generate valid url', async () => {
  expect(await url({ date })).toBe(
    'https://backend.tvguide.com/tvschedules/tvguide/9100001138/web?start=1736640000&duration=240&apiKey=DI9elXhZ3bU6ujsA2gXEKOANyncXGUGc'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content1.json')).toString()
  const results = (await parser({ content, channel, date })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(5)
  expect(results[0]).toMatchObject({
    start: '2025-01-12T01:00:00.000Z',
    stop: '2025-01-12T02:00:00.000Z',
    title: 'FBI: International',
    sub_title: 'Gift',
    description:
      'The owner of a prominent cyber security company is murdered in Copenhagen just before a massive data leak surfaces online, leading the NSA to ask the team for assistance in catching the killer and leaker before more data is revealed.',
    categories: ['Action & Adventure', 'Suspense', 'Drama'],
    season: 3,
    episode: 12,
    rating: {
      system: 'MPA',
      value: 'L'
    }
  })
  expect(results[4]).toMatchObject({
    start: '2025-01-12T06:00:00.000Z',
    stop: '2025-01-12T08:00:00.000Z',
    title: 'Local Programs',
    description:
      'Local programming information.',
    categories: [],
    rating: {
      system: 'MPA',
      value: 'L'
    }
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    date,
    channel,
    content: fs.readFileSync(path.join(__dirname, '__data__', 'no-content.json')).toString()
  })
  expect(results).toMatchObject([])
})
