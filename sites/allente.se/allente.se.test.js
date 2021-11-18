// node ./scripts/channels.js --config=./sites/allente.se/allente.se.config.js --output=./sites/allente.se/allente.se_se.channels.xml --set=country:se --set=lang:sv
// node ./scripts/channels.js --config=./sites/allente.se/allente.se.config.js --output=./sites/allente.se/allente.se_fi.channels.xml --set=country:fi --set=lang:fi
// node ./scripts/channels.js --config=./sites/allente.se/allente.se.config.js --output=./sites/allente.se/allente.se_no.channels.xml --set=country:no --set=lang:no
// node ./scripts/channels.js --config=./sites/allente.se/allente.se.config.js --output=./sites/allente.se/allente.se_dk.channels.xml --set=country:dk --set=lang:da
// npx epg-grabber --config=sites/allente.se/allente.se.config.js --channels=sites/allente.se/allente.se_se.channels.xml --output=.gh-pages/guides/se/allente.se.epg.xml --days=2

const { parser, url, logo } = require('./allente.se.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'se#0148',
  xmltv_id: 'SVT1.se',
  logo: 'https://images.ctfassets.net/989y85n5kcxs/5uT9g9pdQWRZeDPQXVI9g6/e02f550a32e259b9be8081e83dc64948/svt_1_logotyp_rgb_0.png'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe('https://cs-vcb.allente.se/epg/events?date=2021-11-17')
})

it('can generate valid url for different country', () => {
  const dkChannel = { site_id: 'dk#0148' }
  expect(url({ date, channel: dkChannel })).toBe(
    'https://cs-vcb.allente.dk/epg/events?date=2021-11-17'
  )
})

it('can generate valid logo url', () => {
  expect(logo({ channel })).toBe(
    'https://images.ctfassets.net/989y85n5kcxs/5uT9g9pdQWRZeDPQXVI9g6/e02f550a32e259b9be8081e83dc64948/svt_1_logotyp_rgb_0.png'
  )
})

it('can parse response', () => {
  const content = `{"channels":[{"id":"0148","icon":"//images.ctfassets.net/989y85n5kcxs/5uT9g9pdQWRZeDPQXVI9g6/e02f550a32e259b9be8081e83dc64948/svt_1_logotyp_rgb_0.png","name":"SVT1 HD (T)","events":[{"id":"0086202111170415","live":false,"time":"2021-11-17T04:15:00Z","title":"Go'kväll","details":{"title":"Go'kväll","image":"https://viasatps.api.comspace.se/PS/channeldate/image/viasat.ps/21/2021-11-16/se.cs.svt1.event.A_40938191100.jpg?size=2560x1440","description":"Svenskt magasin från 2021. Dockspelare och hundar. Intervju med dockspelarna Björn Carlberg och Petter Lennstrand, personerna bakom tv-favoriter som Allram Eest och Klotty. Nu är de aktuella med turné och en ny dockföreställning. Sofia Åhman ger nya inspirerande träningstips och hundinstruktören Helena Tilly svarar på tittarnas frågor om hundar. Reportageserien \\"Sju sorters kakor\\" fortsätter.","season":2021,"episode":121,"categories":["other"],"duration":"45"}}]}]}`
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-17T04:15:00.000Z',
      stop: '2021-11-17T05:00:00.000Z',
      title: `Go'kväll`,
      category: ['other'],
      description: `Svenskt magasin från 2021. Dockspelare och hundar. Intervju med dockspelarna Björn Carlberg och Petter Lennstrand, personerna bakom tv-favoriter som Allram Eest och Klotty. Nu är de aktuella med turné och en ny dockföreställning. Sofia Åhman ger nya inspirerande träningstips och hundinstruktören Helena Tilly svarar på tittarnas frågor om hundar. Reportageserien \"Sju sorters kakor\" fortsätter.`,
      icon: 'https://viasatps.api.comspace.se/PS/channeldate/image/viasat.ps/21/2021-11-16/se.cs.svt1.event.A_40938191100.jpg?size=2560x1440'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"date":"2001-11-17","categories":[],"channels":[]}`
  })
  expect(result).toMatchObject([])
})
