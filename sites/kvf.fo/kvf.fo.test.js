// npx epg-grabber --config=sites/kvf.fo/kvf.fo.config.js --channels=sites/kvf.fo/kvf.fo.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./kvf.fo.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-21', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'KVFSjonvarp.fo'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://kvf.fo/nskra/sv?date=2021-11-21')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, './__data__/example.html'))
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result[2]).toMatchObject({
    start: '2021-11-21T18:05:00.000Z',
    stop: '2021-11-21T18:30:00.000Z',
    title: `Letibygd 13`
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html> <head></head> <body></body></html>`
  })
  expect(result).toMatchObject([])
})
