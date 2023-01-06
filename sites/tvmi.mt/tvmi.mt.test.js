// npx epg-grabber --config=sites/tvmi.mt/tvmi.mt.config.js --channels=sites/tvmi.mt/tvmi.mt.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tvmi.mt.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-10-29', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2',
  xmltv_id: 'TVM.mt'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe('https://tvmi.mt/schedule/2/2022-10-29')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-10-29T03:30:00.000Z',
    stop: '2022-10-29T04:00:00.000Z',
    title: 'Bizzilla',
    description:
      'Storja ta’ tliet familji, tnejn minnhom miżżewġin bejniethom, u familja oħra li għalkemm mhijiex, b’daqshekk ma jfissirx li mhijiex parti ntegrali fil-kompliċitá li ilha għaddejja bejniethom għal dawn l-aħħar tletin sena.',
    icon: 'https://dist4.tvmi.mt/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjMyNjEwNywiYXVkIjoiMTg4LjI0Mi40OC45MyIsImV4cCI6MTY2NzAxNjM1OH0.N4de761te_pRvWwSUnF6httRAzdukup5syejwXTUv8g/vod/663927/image.jpg'
  })

  expect(results[1]).toMatchObject({
    start: '2022-10-29T04:00:00.000Z',
    stop: '2022-10-29T04:30:00.000Z',
    title: 'The Adventures of Puss in Boots',
    icon: 'https://dist4.tvmi.mt/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjMyNjEwNywiYXVkIjoiMTg4LjI0Mi40OC45MyIsImV4cCI6MTY2NzAxNjM1OH0.N4de761te_pRvWwSUnF6httRAzdukup5syejwXTUv8g/vod/747336/image.jpg'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: `<!doctype html><html><head></head><body></body></html>`,
    channel
  })
  expect(result).toMatchObject([])
})
