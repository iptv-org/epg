// npm run channels:parse -- --config=./sites/zuragt.mn/zuragt.mn.config.js --output=./sites/zuragt.mn/zuragt.mn.channels.xml
// npx epg-grabber --config=sites/zuragt.mn/zuragt.mn.config.js --channels=sites/zuragt.mn/zuragt.mn.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./zuragt.mn.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-01-15', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'mnb',
  xmltv_id: 'MNB.mn'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://m.zuragt.mn/channel/mnb/?date=2023-01-15')
})

it('can generate valid request object', () => {
  expect(request.maxRedirects).toBe(0)
  expect(request.validateStatus(302)).toBe(true)
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  let results = await parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-01-14T23:00:00.000Z',
    stop: '2023-01-15T00:00:00.000Z',
    title: '“Цагийн хүрд” мэдээллийн хөтөлбөр'
  })
})

it('can handle empty guide', async () => {
  const result = await parser({ content: '' })
  expect(result).toMatchObject([])
})
