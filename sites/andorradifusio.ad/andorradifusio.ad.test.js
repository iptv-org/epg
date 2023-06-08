// npx epg-grabber --config=sites/andorradifusio.ad/andorradifusio.ad.config.js --channels=sites/andorradifusio.ad/andorradifusio.ad.channels.xml --output=guide.xml

const { parser, url } = require('./andorradifusio.ad.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-06-07', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'atv',
  xmltv_id: 'AndorraTV.ad'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.andorradifusio.ad/programacio/atv')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-06-07T05:00:00.000Z',
    stop: '2023-06-07T06:00:00.000Z',
    title: `Club Piolet`
  })

  expect(results[20]).toMatchObject({
    start: '2023-06-07T23:00:00.000Z',
    stop: '2023-06-08T00:00:00.000Z',
    title: `Àrea Andorra Difusió`
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
