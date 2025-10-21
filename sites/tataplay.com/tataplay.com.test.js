const { parser, url, channels } = require('./tataplay.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-06-09', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '1001' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://tm.tapi.videoready.tv/content-detail/pub/api/v2/channels/schedule?date=09-06-2025'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  const results = parser({ content, date })

  expect(results.length).toBe(2)
  expect(results[0]).toMatchObject({
    title: 'Yeh Rishta Kya Kehlata Hai',
    start: '2025-06-09T18:00:00.000Z',
    stop: '2025-06-09T18:30:00.000Z',
    description: 'The story of the Rajshri family and their journey through life.',
    category: 'Drama',
    icon: 'https://img.tataplay.com/thumbnails/1001/yeh-rishta.jpg'
  })
  expect(results[1]).toMatchObject({
    title: 'Anupamaa',
    start: '2025-06-09T18:30:00.000Z',
    stop: '2025-06-09T19:00:00.000Z',
    description: 'The story of Anupamaa, a housewife who rediscovers herself.',
    category: 'Drama',
    icon: 'https://img.tataplay.com/thumbnails/1001/anupamaa.jpg'
  })
})

it('can handle empty guide', () => {
  const content = JSON.stringify({ data: { epg: [] } })
  const results = parser({ content, date })
  expect(results).toMatchObject([])
})

it('can parse channel list', async () => {
  const mockResponse = {
    data: {
      data: {
        total: 2,
        channelList: [
          {
            id: '1001',
            title: 'Star Plus',
            transparentImageUrl: 'https://img.tataplay.com/channels/1001/logo.png'
          },
          {
            id: '1002',
            title: 'Sony TV',
            transparentImageUrl: 'https://img.tataplay.com/channels/1002/logo.png'
          }
        ]
      }
    }
  }

  // Mock axios.get to return our test data
  const axios = require('axios')
  axios.get = jest.fn().mockResolvedValue(mockResponse)

  const results = await channels()

  expect(results.length).toBe(2)
  expect(results[0]).toMatchObject({
    site_id: '1001',
    name: 'Star Plus',
    lang: 'en',
    icon: 'https://img.tataplay.com/channels/1001/logo.png'
  })
  expect(results[1]).toMatchObject({
    site_id: '1002',
    name: 'Sony TV',
    lang: 'en',
    icon: 'https://img.tataplay.com/channels/1002/logo.png'
  })
})
