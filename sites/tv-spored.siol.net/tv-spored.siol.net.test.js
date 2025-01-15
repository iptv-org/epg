const { parser, url, request } = require('./tv-spored.siol.net.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-15', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'exodustv',
  xmltv_id: 'ExodusTV.si'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://tv-spored.siol.net/kanal/exodustv/datum/20250115')
})

it('can generate request headers', () => {
  expect(request.headers).toMatchObject({
    Accept: 'text/html'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date })

  expect(results.length).toBe(41)
  expect(results[0]).toMatchObject({
    start: '2025-01-15T00:00:00.000Z',
    stop: '2025-01-15T00:30:00.000Z',
    title: 'Novice iz Svete dežele',
    category: 'informativni',
    season: null,
    episode: null
  })

  expect(results[40]).toMatchObject({
    start: '2025-01-15T23:00:00.000Z',
    stop: '2025-01-15T23:45:00.000Z',
    title: 'Sveta maša',
    category: 'ostalo',
    season: null,
    episode: null
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    content: '<!DOCTYPE html><html><head></head><body></body></html>'
  })
  expect(result).toMatchObject([])
})
