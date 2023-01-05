// npx epg-grabber --config=sites/mtel.ba/mtel.ba.config.js --channels=sites/mtel.ba/mtel.ba.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./mtel.ba.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '001#11',
  xmltv_id: 'RTRSTV.ba'
}
const content = `{"page":0,"total_pages":1,"date":"2021-11-10","channels":[{"id":"11","name":"RTRS","description":null,"link":null,"image":"https:\/\/mtel.ba\/oec\/images\/tv_channels\/c3556aa629b00325aaaea622abfb1070.png","position":"001","items":[{"id_channel":"11","title":"\u0160uma","description":"Krajem decembra 1947. godine jugoslovenski predsjednik Josip Broz Tito prvi put je posjetio Rumuniju. Da bi u\u010dvrstili novo socijalisti\u010dko prijateljstvo, rumunski zvani\u010dnici su poklonili Titu sliku velikog rumunskog umjetnika Jona Andreskua pod nazivom \u0160uma. Mnogo godina kasnije ta slika je umje\u0161ana u napetu \u0161pijunsku pri\u010du i otkriva tajnu koja \u0107e uzdrmati temelje i Jugoslavije i Rumunije. Film je svjedok kompleksnosti i raznovrsnosti glasova koji \u010dine ono \u0161to zovemo stvarno\u0161\u0107u.","start":"00:00:00","duration":"46.00","full_start":"2021-11-09 23:29:00","full_end":"2021-11-10 00:46:00","image":"https:\/\/mtel.ba\/oec\/images\/epg\/60881491.jpg","category":"Televizijski film","subcategory":"Dokumentarna drama"},{"id_channel":"11","title":"Nema informacija o programu","description":"","start":"07:32:00","duration":"988.00","full_start":"2021-11-10 07:32:00","full_end":"2021-11-10 24:00:00","image":"","category":"","subcategory":""}]}]}`

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://mtel.ba/oec/epg/program?date=2021-11-10&position=001'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'X-Requested-With': 'XMLHttpRequest'
  })
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: '2021-11-09T22:29:00.000Z',
      stop: '2021-11-09T23:46:00.000Z',
      title: 'Šuma',
      icon: 'https://mtel.ba/oec/images/epg/60881491.jpg',
      description: `Krajem decembra 1947. godine jugoslovenski predsjednik Josip Broz Tito prvi put je posjetio Rumuniju. Da bi učvrstili novo socijalističko prijateljstvo, rumunski zvaničnici su poklonili Titu sliku velikog rumunskog umjetnika Jona Andreskua pod nazivom Šuma. Mnogo godina kasnije ta slika je umješana u napetu špijunsku priču i otkriva tajnu koja će uzdrmati temelje i Jugoslavije i Rumunije. Film je svjedok kompleksnosti i raznovrsnosti glasova koji čine ono što zovemo stvarnošću.`,
      category: 'Televizijski film'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"message":"Tra\u017eeni termin nije prona\u0111en.\u003Cbr\u003E\u003Cbr\u003EProverite da li ste upisali pravilno ili poku\u0161ajte sa nekim drugim terminom."}`
  })
  expect(result).toMatchObject([])
})
