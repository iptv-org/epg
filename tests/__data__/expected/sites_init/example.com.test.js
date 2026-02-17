const { parser, url } = require('./example.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-12', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'bbc1' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://example.com/api/bbc1/2025-01-12')
})

it('can parse response', () => {
  const content =
    '[{"title":"Program 1","start":"2025-01-12T00:00:00.000Z","stop":"2025-01-12T00:30:00.000Z"},{"title":"Program 2","start":"2025-01-12T00:30:00.000Z","stop":"2025-01-12T01:00:00.000Z"}]'

  const results = parser({ content })

  expect(results.length).toBe(2)
  expect(results[0]).toMatchObject({
    title: 'Program 1',
    start: '2025-01-12T00:00:00.000Z',
    stop: '2025-01-12T00:30:00.000Z'
  })
  expect(results[1]).toMatchObject({
    title: 'Program 2',
    start: '2025-01-12T00:30:00.000Z',
    stop: '2025-01-12T01:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
