const { parser, url, request } = require('./aljazeera.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-04-22', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'aje#' }

it('can generate valid url', () => {
  expect(url({ channel })).toBe(
    'https://www.aljazeera.com/graphql?wp-site=aje&operationName=ArchipelagoSchedulePageQuery&variables={"postName":"schedule","preview":""}&extensions={}'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers({ channel })).toMatchObject({
    'wp-site': 'aje'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(35)
  expect(results[0]).toMatchObject({
    title: 'NEWSHOUR',
    description: 'Latest news and in-depth analysis from around the world.',
    start: '2026-04-21T12:00:00.000Z',
    stop: '2026-04-21T13:00:00.000Z'
  })
  expect(results[34]).toMatchObject({
    title: 'Inside Story',
    description:
      'Beyond the headlines to the heart of the news of the day. Al Jazeera gets the Inside Story from some of the best minds from around the globe.',
    start: '2026-04-22T11:30:00.000Z',
    stop: '2026-04-22T12:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '', date })

  expect(results).toMatchObject([])
})
