// npx epg-grabber --config=sites/tv.nu/tv.nu.config.js --channels=sites/tv.nu/tv.nu_se.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tv.nu.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-06', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '3sat',
  xmltv_id: '3sat.de'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://web-api.tv.nu/channels/3sat/schedule?date=2022-03-06&fullDay=true'
  )
})

it('can parse response', () => {
  const content = `{"data":{"broadcasts":[{"type":"broadcast","id":"1NqJwy-2l-8enC","slug":"vielfaltige-vogelwelt-osterreich","programId":"174565","isPlay":false,"isMovie":false,"isSeries":false,"isLive":false,"title":"Vielfältige Vogelwelt Österreich","description":"In Österreich sind mehr als 400 Vogelarten nachgewiesen und manche von ihnen fallen durch optische Eigenheiten ganz besonders auf. Diese Dokumentation befasst sich mit dem Bienenfresser, dem Fichtenkreuzschnäbel und dem Stelzenläufer.","imagePortrait":"https://new.static.tv.nu/86184349","imageLandscape":"https://new.static.tv.nu/86184347","genres":["Natur","Special"],"playProviders":[],"broadcast":{"id":"1NqJwy-2l-8enC","startTime":1646542800000,"endTime":1646543700000,"channel":{"name":"3sat","slug":"3sat","themedLogo":{"light":{"url":"https://new.static.tv.nu/19402383","isFallback":false},"dark":{"url":"https://new.static.tv.nu/59995595","isFallback":true}}}}}]}}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-06T05:00:00.000Z',
      stop: '2022-03-06T05:15:00.000Z',
      title: 'Vielfältige Vogelwelt Österreich',
      description:
        'In Österreich sind mehr als 400 Vogelarten nachgewiesen und manche von ihnen fallen durch optische Eigenheiten ganz besonders auf. Diese Dokumentation befasst sich mit dem Bienenfresser, dem Fichtenkreuzschnäbel und dem Stelzenläufer.',
      icon: 'https://new.static.tv.nu/86184347',
      category: ['Natur', 'Special']
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"meta":{"status":200},"data":{"broadcasts":[]}}`
  })
  expect(result).toMatchObject([])
})
