const { parser, url } = require('./epgshare01.online.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-02-09', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'ALJAZEERA1#AlJazeera.English.net' }

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://epgshare01.online/epgshare01/epg_ripper_ALJAZEERA1.xml.gz')
})

it('can parse response', () => {
  const buffer = fs.readFileSync(path.resolve(__dirname, '__data__/content.xml.gz'))

  const results = parser({ buffer, channel, date, cached: false })

  expect(results.length).toBe(40)
  expect(results[0]).toMatchObject({
    title: 'The Palestine Laboratory',
    description:
      "Exposing how Israel's sales of military technology is aiding state control around the world.",
    start: '2025-02-09T00:00:00.000Z',
    stop: '2025-02-09T01:00:00.000Z'
  })
  expect(results[39]).toMatchObject({
    title: 'Inside Story',
    description:
      'Beyond the headlines to the heart of the news of the day. Al Jazeera gets the Inside Story from some of the best minds from around the globe.',
    start: '2025-02-09T23:30:00.000Z',
    stop: '2025-02-10T00:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '', channel, date, cached: false })

  expect(results).toMatchObject([])
})
