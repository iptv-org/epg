const { parser, url, request } = require('./plex.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-02-05', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '5eea605674085f0040ddc7a6',
  xmltv_id: 'Heartland.ca'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://epg.provider.plex.tv/grid?channelGridKey=5eea605674085f0040ddc7a6&date=2023-02-05'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'x-plex-provider-version': '7.2' // Updated to match config.js
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content })
  results = results.map(p => {
    if (p.start) p.start = p.start.toJSON()
    if (p.stop) p.stop = p.stop.toJSON()
    return p
  })

  // Testing first item: "Cowgirls Don’t Cry"
  expect(results[0]).toMatchObject({
    title: 'Heartland',
    subTitle: 'Cowgirls Don’t Cry',
    description: expect.stringContaining('Tim ouvre une école de rodéo'),
    rating: 'TV-PG',
    season: 8,
    episode: 13,
    date: '2015-02-15T00:00:00Z'
  })

  // Testing another item: "Riders on the Storm"
  expect(results[1]).toMatchObject({
    title: 'Heartland',
    subTitle: 'Riders on the Storm',
    description: expect.stringContaining('Amy et Ty aident le neveu de Scott'),
    season: 8,
    episode: 14,
    image: expect.stringContaining('Heartland_landscape.jpg')
  })
})

it('can handle empty guide', () => {
  const content = JSON.stringify({ MediaContainer: { Metadata: [] } })
  const results = parser({ content })

  expect(results).toMatchObject([])
})

it('can parse channel list', async () => {
  const axios = require('axios')
  axios.get.mockResolvedValue({
    data: {
      MediaContainer: {
        Channel: [
          {
            title: 'Heartland TV',
            gridKey: 'heartland-key',
            id: '12345'
          }
        ]
      }
    }
  })

  const { channels } = require('./plex.tv.config.js')
  const results = await channels({ token: 'TEST_TOKEN' })

  expect(results[0]).toMatchObject({
    lang: 'en',
    site_id: 'heartland-key',
    name: 'Heartland TV'
  })
})