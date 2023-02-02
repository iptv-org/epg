// npm run channels:parse -- --config=./sites/singtel.com/singtel.com.config.js --output=./sites/singtel.com/singtel.com.channels.xml
// npx epg-grabber --config=sites/singtel.com/singtel.com.config.js --channels=sites/singtel.com/singtel.com.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./singtel.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-01-29', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '5418',
  xmltv_id: 'ParamountNetworkSingapore.sg'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.singtel.com/etc/singtel/public/tv/epg-parsed-data/29012023.json'
  )
})


it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, channel})
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(23)
  expect(results[0]).toMatchObject({
    start: '2023-01-28T16:00:00.000Z',
    stop: '2023-01-28T17:30:00.000Z',
    title: 'Hip Hop Family Christmas Wedding',
    description:
      `Hip Hop's most famous family is back, and this time Christmas wedding bells are ringing! Jessica and Jayson are getting ready to say their "I do's".`,
    category: 'Specials'
  })

  expect(results[10]).toMatchObject({
    start: '2023-01-29T01:00:00.000Z',
    stop: '2023-01-29T01:30:00.000Z',
    title: 'The Daily Show',
    description:
      "The Daily Show correspondents tackle the biggest stories in news, politics and pop culture.",
    category: 'English Entertainment'
  })

})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const results = parser({ content, channel })

  expect(results).toMatchObject([])
})
