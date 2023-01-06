// npx epg-grabber --config=sites/digiturk.com.tr/digiturk.com.tr.config.js --channels=sites/digiturk.com.tr/digiturk.com.tr.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./digiturk.com.tr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-08-27', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '19',
  xmltv_id: 'TRT1.tr'
}

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe('https://www.digiturk.com.tr/yayin-akisi/api/program/kanal/19/2022-08-27/0')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-08-26T19:50:00.000Z',
    stop: '2022-08-26T22:20:00.000Z',
    title: 'YABANCI SİNEMA "KİMLİKSİZ"',
    description: `KİMLİĞİNİ KANITLAMAK İÇİN MACERALI BİR YOLCULUĞA ÇIKAR.`
  })

  expect(results[11]).toMatchObject({
    start: '2022-08-27T20:30:00.000Z',
    stop: '2022-08-27T21:45:00.000Z',
    title: 'PELİN ÇİFT İLE GÜNDEM ÖTESİ',
    description: `ULUYOR. İLGİ ÇEKİCİ KONULARI VE UZMAN KONUKLARIYLA BİLDİĞİNİZDEN FAZLASINI EKRANA TAŞIYOR.`
  })
})

it('can handle empty guide', () => {
  const result = parser({ date, channel, content: `{"listings":{"1483":[]}}` })
  expect(result).toMatchObject([])
})
