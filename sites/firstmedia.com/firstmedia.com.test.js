const { url, parser } = require('./firstmedia.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2023-11-08').startOf('d')
const channel = { site_id: '243', xmltv_id: 'AlJazeeraEnglish.qa', lang: 'id' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://api.firstmedia.com/api/content/tv-guide/list?date=08/11/2023&channel=243&startTime=1&endTime=24'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const results = parser({ content, channel, date })

  // All time in Asia/Jakarta
  // 2023-11-08 17:00:00 -> 2023-11-08 20:00:00 = 2023-11-08 03:00:00
  // 2023-11-08 17:00:00 -> 2023-11-08 20:30:00 = 2023-11-08 03:30:00
  expect(results).toMatchObject([
    {
      start: '2023-11-07T20:00:00.000Z',
      stop: '2023-11-07T20:30:00.000Z',
      title: 'News Live',
      description: 'Up to date news and analysis from around the world.'
    }
  ])
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
