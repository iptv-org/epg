// npm run channels:parse -- --config=./sites/visionplus.id/visionplus.id.config.js --output=./sites/visionplus.id/visionplus.id.channels.xml
// npx epg-grabber --config=sites/visionplus.id/visionplus.id.config.js --channels=sites/visionplus.id/visionplus.id.channels.xml --output=guide.xml

const { parser, url, request } = require('./visionplus.id.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-06-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2',
  xmltv_id: 'RCTI.id'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://epg-api.visionplus.id/api/v1/epg?isLive=false&start_time_from=2023-06-30&channel_ids=2'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    Authorization:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE5NDY0NTE4OTcsInVpZCI6MCwicGwiOiJ3ZWIiLCJndWVzdF90b2tlbiI6ImNhNGNjMjdiNzc3MjBjODEwNzQ2YzY3MTY4NzNjMDI3NGU4NWYxMWQifQ.tt08jLZ3HiNadUeSgc9O-nhIzEi7WMYRjxMb05lEZ74'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(18)
  expect(results[0]).toMatchObject({
    start: '2023-06-29T18:15:00.000Z',
    stop: '2023-06-29T19:00:00.000Z',
    title: 'Hafalan Shalat Delisa',
    description: ``
  })

  expect(results[17]).toMatchObject({
    start: '2023-06-30T16:15:00.000Z',
    stop: '2023-06-30T18:15:00.000Z',
    title: 'Tukang Bubur Pulang Haji',
    description: ''
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content, channel })

  expect(results).toMatchObject([])
})
