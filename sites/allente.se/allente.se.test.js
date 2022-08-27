// node ./scripts/channels.js --config=./sites/allente.se/allente.se.config.js --output=./sites/allente.se/allente.se_se.channels.xml --set=country:se --set=lang:sv
// node ./scripts/channels.js --config=./sites/allente.se/allente.se.config.js --output=./sites/allente.se/allente.se_fi.channels.xml --set=country:fi --set=lang:fi
// node ./scripts/channels.js --config=./sites/allente.se/allente.se.config.js --output=./sites/allente.se/allente.se_no.channels.xml --set=country:no --set=lang:no
// node ./scripts/channels.js --config=./sites/allente.se/allente.se.config.js --output=./sites/allente.se/allente.se_dk.channels.xml --set=country:dk --set=lang:da
// npx epg-grabber --config=sites/allente.se/allente.se.config.js --channels=sites/allente.se/allente.se_se.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./allente.se.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'se#0148',
  xmltv_id: 'SVT1.se'
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

it('can parse response', () => {
  const content = `{"channels":[{"id":"0148","icon":"//images.ctfassets.net/989y85n5kcxs/5uT9g9pdQWRZeDPQXVI9g6/9cc44da567f591822ed645c99ecdcb64/SVT_1_black_new__2_.png","name":"SVT1 HD (T)","events":[{"id":"0086202208220710","live":false,"time":"2022-08-22T07:10:00Z","title":"Hemmagympa med Sofia","details":{"title":"Hemmagympa med Sofia","image":"https://viasatps.api.comspace.se/PS/channeldate/image/viasat.ps/21/2022-08-22/se.cs.svt1.event.A_41214031600.jpg?size=2560x1440","description":"Svenskt träningsprogram från 2021. Styrka. Sofia Åhman leder SVT:s hemmagympapass. Denna gång fokuserar vi på styrka.","season":4,"episode":1,"categories":["other"],"duration":"20"}}]}]}`
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-08-22T07:10:00.000Z',
      stop: '2022-08-22T07:30:00.000Z',
      title: `Hemmagympa med Sofia`,
      category: ['other'],
      description: `Svenskt träningsprogram från 2021. Styrka. Sofia Åhman leder SVT:s hemmagympapass. Denna gång fokuserar vi på styrka.`,
      icon: 'https://viasatps.api.comspace.se/PS/channeldate/image/viasat.ps/21/2022-08-22/se.cs.svt1.event.A_41214031600.jpg?size=2560x1440',
      season: 4,
      episode: 1
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
