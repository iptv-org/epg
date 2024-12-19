const { url, parser } = require('./cyta.com.cy.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const cheerio = require('cheerio')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const date = dayjs.utc('2024-12-19', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '561066', xmltv_id: 'RIK1.cy', lang: 'el' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://epg.cyta.com.cy/api/mediacatalog/fetchEpg?startTimeEpoch=1734584400000&endTimeEpoch=1734670799000&language=1&channelIds=561066')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const results = parser({content, date}).map(p => {
    return p
  })

  expect(results).toMatchObject([
    {
      start: '2024-12-19T01:30:00.000Z',
      stop: '2024-12-19T02:00:00.000Z',
      title: 'Πρώτη Ενημέρωση'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '[]'
  })
  expect(result).toMatchObject([])
})