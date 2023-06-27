// npx epg-grabber --config=sites/streamingtvguides.com/streamingtvguides.com.config.js --channels=sites/streamingtvguides.com/streamingtvguides.com.channels.xml --output=guide.xml

const { parser, url } = require('./streamingtvguides.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-06-27', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'GMAPNY',
  xmltv_id: 'GMAPinoyTVUSACanada.ph'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://streamingtvguides.com/Channel/GMAPNY')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(38)

  expect(results[0]).toMatchObject({
    start: '2023-06-27T00:40:00.000Z',
    stop: '2023-06-27T02:00:00.000Z',
    title: `24 Oras`,
    description: 'Up to the minute news around the world.'
  })

  expect(results[37]).toMatchObject({
    start: '2023-06-27T21:50:00.000Z',
    stop: '2023-06-28T00:00:00.000Z',
    title: `Eat Bulaga`,
    description: 'Rousing and engrossing segments with engaging hosts.'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  const result = parser({
    date,
    content
  })
  expect(result).toMatchObject([])
})
