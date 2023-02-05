// npm run channels:parse -- --config=./sites/plex.tv/plex.tv.config.js --output=./sites/plex.tv/plex.tv.channels.xml
// npx epg-grabber --config=sites/plex.tv/plex.tv.config.js --channels=sites/plex.tv/plex.tv.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./plex.tv.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-02-05', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '5e20b730f2f8d5003d739db7-5eea605674085f0040ddc7a6',
  xmltv_id: 'DarkMatterTV.us'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://epg.provider.plex.tv/grid?channelGridKey=5eea605674085f0040ddc7a6&date=2023-02-05'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'x-plex-provider-version': '5.1'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  // expect(results.length).toBe(15)
  expect(results[0]).toMatchObject({
    start: '2023-02-04T23:31:14.000Z',
    stop: '2023-02-05T01:10:45.000Z',
    title: 'Violet & Daisy',
    description:
      'Two teenage assassins accept what they think will be a quick-and-easy job, until an unexpected target throws them off their plan.',
    icon: 'https://provider-static.plex.tv/epg/images/ott_channels/arts/darkmatter-tv-about.jpg',
    categories: ['Movies']
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content })

  expect(results).toMatchObject([])
})
