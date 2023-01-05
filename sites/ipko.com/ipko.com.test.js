// npx epg-grabber --config=sites/ipko.com/ipko.com.config.js --channels=sites/ipko.com/ipko.com.channels.xml --days=2 --output=guide.xml

const { parser, url } = require('./ipko.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-10-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '406',
  xmltv_id: 'RTK1.xk'
}
const content = `{"element":{"1":[{"id":6367,"channel_id":406,"program_name":"Beautiful People 13","name_short":"","description":"Lin largohet nga Nju Meksiko për t'u vendosur në Nju Jork e për t'ia nisur nga fillimi: një punë të re, shtëpi të re dhe njohje të reja. Bashkë me të janë vajzat e saj, Sofia, një 16 vjeçare që shkëlqen në shkollë, dhe Kareni, 20 vjeçare, që do të bë","category":"Sezoni I","duration":150,"day":"Sun","left_distanc":165,"date":"00:55:00"}]}}`

it('can generate valid url', () => {
  const result = url({ date })
  expect(result).toBe('https://www.ipko.com/epg/admin/programs.php?date=2021-10-24')
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: 'Sun, 24 Oct 2021 00:55:00 GMT',
      stop: 'Sun, 24 Oct 2021 01:45:00 GMT',
      title: 'Beautiful People 13',
      description: `Lin largohet nga Nju Meksiko për t'u vendosur në Nju Jork e për t'ia nisur nga fillimi: një punë të re, shtëpi të re dhe njohje të reja. Bashkë me të janë vajzat e saj, Sofia, një 16 vjeçare që shkëlqen në shkollë, dhe Kareni, 20 vjeçare, që do të bë`,
      category: 'Sezoni I'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({ date, channel, content: `{"element":{"1":[{"no":"no"}]}}` })
  expect(result).toMatchObject([])
})
