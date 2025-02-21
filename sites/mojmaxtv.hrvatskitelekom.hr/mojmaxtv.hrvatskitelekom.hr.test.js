const { parser, url, request } = require('./mojmaxtv.hrvatskitelekom.hr.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-24', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '274913832105', xmltv_id: 'HRT1.hr' }

jest.mock('axios')

axios.get.mockImplementation(url => {
  if (
    url ===
    'https://tv-hr-prod.yo-digital.com/hr-bifrost/epg/channel/schedules?date=2025-01-24&hour_offset=3&hour_range=3&channelMap_id&filler=true&app_language=hr&natco_code=hr'
  ) {
    return Promise.resolve({
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/content_3.json')))
    })
  } else if (
    url ===
    'https://tv-hr-prod.yo-digital.com/hr-bifrost/epg/channel/schedules?date=2025-01-24&hour_offset=21&hour_range=3&channelMap_id&filler=true&app_language=hr&natco_code=hr'
  ) {
    return Promise.resolve({
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/content_21.json')))
    })
  } else {
    return Promise.resolve({
      data: {}
    })
  }
})

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://tv-hr-prod.yo-digital.com/hr-bifrost/epg/channel/schedules?date=2025-01-24&hour_offset=0&hour_range=3&channelMap_id&filler=true&app_language=hr&natco_code=hr'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    app_key: 'GWaBW4RTloLwpUgYVzOiW5zUxFLmoMj5',
    app_version: '02.0.1080',
  })
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_0.json'))

  const results = await parser({ content, channel, date })

  expect(results.length).toBe(17)
  expect(results[0]).toMatchObject({
    title: 'Planet Zemlja: Junaci',
    categories: ['Dokumentarni'],
    season: 3,
    episode: 8,
    date: '2023',
    start: '2025-01-23T23:16:00.00Z',
    stop: '2025-01-24T00:08:00.00Z'
  })
  expect(results[16]).toMatchObject({
    title: 'Harry Haft, film',
    categories: ['Film', 'Drama', 'Biografski'],
    season: null,
    episode: null,
    date: '2021',
    start: '2025-01-24T21:50:00.00Z',
    stop: '2025-01-25T00:00:00.00Z'
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    date,
    channel,
    content: '{}'
  })

  expect(results).toMatchObject([])
})
