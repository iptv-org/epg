// npm run channels:parse -- --config=./sites/cgates.lt/cgates.lt.config.js --output=./sites/cgates.lt/cgates.lt.channels.xml
// npx epg-grabber --config=sites/cgates.lt/cgates.lt.config.js --channels=sites/cgates.lt/cgates.lt.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./cgates.lt.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-08-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'lrt-televizija-hd',
  xmltv_id: 'LRTTV.lt'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.cgates.lt/tv-kanalai/lrt-televizija-hd/')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(35)
  expect(results[0]).toMatchObject({
    start: '2022-08-29T21:05:00.000Z',
    stop: '2022-08-29T21:30:00.000Z',
    title: '31-oji nuovada (District 31), Drama, 2016',
    description:
      'Seriale pasakojama apie kasdienius policijos išbandymus ir sunkumus. Vadovybė pertvarko Monrealio miesto policijos struktūrą: išskirsto į 36 policijos nuovadas, kad šios būtų arčiau gyventojų. 31-osios nuovados darbuotojams tenka kone sunkiausias darbas: šiame miesto rajone gyvena socialiai remtinos šeimos, nuolat kovojančios su turtingųjų klase, įsipliekia ir rasinių konfliktų. Be to, čia akivaizdus kartų atotrūkis, o tapti nusikalstamo pasaulio dalimi labai lengva. Serialo siužetas – intensyvus, nauji nusikaltimai tiriami kiekvieną savaitę. Čia vaizduojamas nepagražintas nusikalstamas pasaulis, jo poveikis rajono gyventojams. Policijos nuovados darbuotojai narplios įvairiausių nusikaltimų schemas. Tai ir pagrobimai, įsilaužimai, žmogžudystės, smurtas artimoje aplinkoje, lytiniai nusikaltimai, prekyba narkotikais, teroristinių išpuolių grėsmė ir pan. Šis serialas leis žiūrovui įsigilinti į policijos pareigūnų realybę, pateiks skirtingą požiūrį į kiekvieną nusikaltimą.'
  })

  expect(results[34]).toMatchObject({
    start: '2022-08-30T20:45:00.000Z',
    stop: '2022-08-30T21:15:00.000Z',
    title: '31-oji nuovada (District 31), Drama, 2016!'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: ''
  })
  expect(result).toMatchObject([])
})
