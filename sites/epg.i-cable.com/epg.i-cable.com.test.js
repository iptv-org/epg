// npm run channels:parse -- --config=./sites/epg.i-cable.com/epg.i-cable.com.config.js --output=./sites/epg.i-cable.com/epg.i-cable.com.channels.xml --set=lang:zh
// npx epg-grabber --config=sites/epg.i-cable.com/epg.i-cable.com.config.js --channels=sites/epg.i-cable.com/epg.i-cable.com.channels.xml --output=guide.xml

const { parser, url } = require('./epg.i-cable.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-11-15', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '003',
  xmltv_id: 'HOYTV.hk',
  lang: 'zh'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'http://epg.i-cable.com/ci/channel/epg/003/2022-11-15?api=api'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-14T22:00:00.000Z',
    stop: '2022-11-14T23:00:00.000Z',
    title: 'Bloomberg 時段'
  })

  expect(results[31]).toMatchObject({
    start: '2022-11-15T21:00:00.000Z',
    stop: '2022-11-15T21:30:00.000Z',
    title: 'Bloomberg 時段'
  })
})

it('can parse response in English', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const channelEN = { ...channel, lang: 'en' }
  let results = parser({ content, channel: channelEN, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-14T22:00:00.000Z',
    stop: '2022-11-14T23:00:00.000Z',
    title: 'Bloomberg Hour'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ date, channel, content })

  expect(results).toMatchObject([])
})
