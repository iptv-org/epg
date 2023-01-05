// npm run channels:parse -- --config=./sites/foxtel.com.au/foxtel.com.au.config.js --output=./sites/foxtel.com.au/foxtel.com.au.channels.xml
// npx epg-grabber --config=sites/foxtel.com.au/foxtel.com.au.config.js --channels=sites/foxtel.com.au/foxtel.com.au.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./foxtel.com.au.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-11-08', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'Channel-9-Sydney/NIN',
  xmltv_id: 'Channel9Sydney.au'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.foxtel.com.au/tv-guide/channel/Channel-9-Sydney/NIN/2022/11/08'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Accept-Language': 'en-US,en;',
    Cookie: 'AAMC_foxtel_0=REGION|6'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-07T12:40:00.000Z',
    stop: '2022-11-07T13:30:00.000Z',
    title: 'The Equalizer',
    sub_title: 'Glory',
    icon: 'https://images1.resources.foxtel.com.au/store2/mount1/16/3/69e0v.jpg?maxheight=90&limit=91aa1c7a2c485aeeba0706941f79f111adb35830',
    rating: {
      system: 'ACB',
      value: 'M'
    },
    season: 1,
    episode: 2
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no-content.html'))
  })
  expect(result).toMatchObject([])
})
