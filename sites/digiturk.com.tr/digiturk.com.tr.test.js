// npx epg-grabber --config=sites/digiturk.com.tr/digiturk.com.tr.config.js --channels=sites/digiturk.com.tr/digiturk.com.tr_tr.channels.xml --output=.gh-pages/guides/tr/digiturk.com.tr.epg.xml --days=2

const { parser, url } = require('./digiturk.com.tr.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '483',
  xmltv_id: 'BeInTurkiye.qa'
}
const content = `{"listings":{"483":[{"ProgramId":null,"ChannelId":483,"ProgramName":"MAÇA KIZI","OrginalName":"QUEEN OF SPADES (2021)","BroadcastStart":"2021-11-10T23:25:00","BroadcastEnd":"2021-11-11T00:53:00","BroadcastDuration":5245,"PartNo":null,"HasSubtitle":false,"ProgramLanguage":null,"ScreenRatio":"4:3","IsLive":false,"Synopsis":"[QUEEN OF SPADES] DÖRT GENÇ, EFSANEYE GÖRE MAÇA KIZI OLARAK BİLİNEN BİR RUHU ÇAĞIRMAK İÇİN RİTÜEL GERÇEKLEŞTİRİRLER.BU RİTÜELİN SONUNDA KORKU DOLU ANLAR YAŞANACAKTIR.","CreatedBy":"EPG Import Service","CreatedDate":"2021-11-10T10:47:00","UpdatedBy":"EPG Import Service","LastModifyDate":"2021-11-10T10:47:00","LastIP":null,"Genre":"E8","Rating":"D6","Year":"2021","Actors":"AVA PRESTON , KAELEN OHM , JAMIE BLOCH ,","SeriesId":null,"SeasonId":null,"LongDescription":"PATRICK WHITE'IN İLK YÖNETMENLİK DENEYİMİ OLAN BU KORKU FİLMİNİN BAŞROLLERİNDE AVA PRESTON VE KAELEN OHM YER ALIYOR.","ServiceRef":"7808","ContentRef":"PV0000340386","EventId":"8432","ScreenSize":null,"AudioType":null,"BroadcastTimeStamp":1636586700,"Directors":"PATRICK WHITE ,","ProductionCountries":"CAN","MasterProductionID":"PT0000324047","EPGBroadcastID":"LYS188925910","Id":1404880537}]}}`

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe('https://www.digiturk.com.tr/yayin-akisi/api/program/kanal/483/2021-11-10/0')
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: '2021-11-10T20:25:00.000Z',
      stop: '2021-11-10T21:53:00.000Z',
      title: 'MAÇA KIZI',
      description: `PATRICK WHITE'IN İLK YÖNETMENLİK DENEYİMİ OLAN BU KORKU FİLMİNİN BAŞROLLERİNDE AVA PRESTON VE KAELEN OHM YER ALIYOR.`,
      category: 'Korku'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({ date, channel, content: `{"listings":{"1483":[]}}` })
  expect(result).toMatchObject([])
})
