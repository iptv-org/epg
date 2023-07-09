// npx epg-grabber --config=sites/nhkworldpremium.com/nhkworldpremium.com.config.js --channels=sites/nhkworldpremium.com/nhkworldpremium.com_en.channels.xml --output=guide.xml
// npx epg-grabber --config=sites/nhkworldpremium.com/nhkworldpremium.com.config.js --channels=sites/nhkworldpremium.com/nhkworldpremium.com_ja.channels.xml --output=guide.xml

const { parser, url, request } = require('./nhkworldpremium.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-07-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'NHKWorldPremium.jp',
  lang: 'en'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://nhkworldpremium.com/backend/api/v1/front/episodes?lang=en')
})

it('can generate valid url for Japanese guide', () => {
  const channel = {
    site_id: '#',
    xmltv_id: 'NHKWorldPremium.jp',
    lang: 'ja'
  }

  expect(url({ channel })).toBe('https://nhkworldpremium.com/backend/api/v1/front/episodes?lang=ja')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_en.json'))
  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(56)
  expect(results[0]).toMatchObject({
    start: '2023-07-09T15:35:00.000Z',
    stop: '2023-07-09T16:20:00.000Z',
    title: 'NHK Amateur Singing Contest',
    sub_title: '"Maizuru City, Kyoto Prefecture"'
  })

  expect(results[55]).toMatchObject({
    start: '2023-07-10T14:35:00.000Z',
    stop: '2023-07-10T15:15:00.000Z',
    title: 'International News Report 2023',
    sub_title: null
  })
})

it('can parse response with Japanese guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_ja.json'))
  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(56)
  expect(results[0]).toMatchObject({
    start: '2023-07-09T15:35:00.000Z',
    stop: '2023-07-09T16:20:00.000Z',
    title: 'NHKのど自慢',
    sub_title: '【京都から生放送！▽前川清・相川七瀬】'
  })

  expect(results[55]).toMatchObject({
    start: '2023-07-10T14:35:00.000Z',
    stop: '2023-07-10T15:15:00.000Z',
    title: '国際報道2023',
    sub_title: null
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: {}, date })

  expect(results).toMatchObject([])
})
