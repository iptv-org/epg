// npx epg-grabber --config=sites/digiturk.com.tr/digiturk.com.tr.config.js --channels=sites/digiturk.com.tr/digiturk.com.tr.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./digiturk.com.tr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '14',
  xmltv_id: 'beINMovies2Action.qa'
}

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe('https://www.digiturk.com.tr/_Ajax/getBroadcast.aspx?channelNo=14&date=19.01.2023&tomorrow=false&primetime=false')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-01-18T20:40:00.000Z',
    stop: '2023-01-18T22:32:00.000Z',
    title: 'PARÇALANMIŞ'
  })

  expect(results[10]).toMatchObject({
    start: '2023-01-19T05:04:00.000Z',
    stop: '2023-01-19T06:42:00.000Z',
    title: 'HIZLI VE ÖFKELİ: TOKYO YARIŞI'
  })
})

it('can handle empty guide', () => {
  const result = parser({ content: `` })
  expect(result).toMatchObject([])
})
