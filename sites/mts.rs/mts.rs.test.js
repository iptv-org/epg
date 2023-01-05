// npx epg-grabber --config=sites/mts.rs/mts.rs.config.js --channels=sites/mts.rs/mts.rs.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./mts.rs.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-07', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '101#597',
  xmltv_id: 'RTS1.rs'
}
const content = `{"page":0,"total_pages":1,"date":"2021-11-07","channels":[{"id":"597","name":"RTS 1","description":null,"link":null,"image":"https:\/\/mts.rs\/oec\/images\/tv_channels\/904ddd8cd6720a4a1c23eae513b5b957.jpg","position":"101","positions":"101","items":[{"id_channel":"597","title":"Zaboravljeni zlo\u010din","description":"Novinarka-fotoreporter, D\u017ein, istra\u017euje okrutno i senzacionalno, nere\u0161eno ubistvo sekirom iz davne 1873. godine. Ubistvo koje koincidira sa nedavnim identi\u010dnim brutalnim dvostrukim ubistvom. Zaplet se odvija izme\u0111u pri\u010de o\u010devica iz toga doba - pri\u010de iz novinske arhive i D\u017einine privatne borbe sa ljubomorom i sumnjom koje prate njen brak.","start":"00:00:00","duration":"103.00","full_start":"2021-11-06 23:44:00","full_end":"2021-11-07 01:43:00","image":"https:\/\/mts.rs\/oec\/images\/epg\/2_abb81cc24d8ce957eece50f991a31e59780e4e53_E7D8ECDE568E84E3C86CCDBDB647355E.jpg","category":"Bioskopski film","subcategory":""}]}]}`

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe('https://mts.rs/oec/epg/program?date=2021-11-07&position=101')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'X-Requested-With': 'XMLHttpRequest'
  })
})

it('can parse response', () => {
  const result = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(result).toMatchObject([
    {
      start: '2021-11-06T22:44:00.000Z',
      stop: '2021-11-07T00:43:00.000Z',
      title: 'Zaboravljeni zlo\u010din',
      category: 'Bioskopski film',
      icon: 'https://mts.rs/oec/images/epg/2_abb81cc24d8ce957eece50f991a31e59780e4e53_E7D8ECDE568E84E3C86CCDBDB647355E.jpg',
      description: `Novinarka-fotoreporter, D\u017ein, istra\u017euje okrutno i senzacionalno, nere\u0161eno ubistvo sekirom iz davne 1873. godine. Ubistvo koje koincidira sa nedavnim identi\u010dnim brutalnim dvostrukim ubistvom. Zaplet se odvija izme\u0111u pri\u010de o\u010devica iz toga doba - pri\u010de iz novinske arhive i D\u017einine privatne borbe sa ljubomorom i sumnjom koje prate njen brak.`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"message":"Nema rezultata."}`
  })
  expect(result).toMatchObject([])
})
