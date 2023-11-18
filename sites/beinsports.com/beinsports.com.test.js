// npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_mena-ar.channels.xml --set=region:mena --set=lang:ar
// npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_mena-en.channels.xml --set=region:mena --set=lang:en
// npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_fr-fr.channels.xml --set=region:fr --set=lang:fr
// npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_my-en.channels.xml --set=region:my --set=lang:en
// npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_us-en.channels.xml --set=region:us --set=lang:en
// npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_us-es.channels.xml --set=region:us --set=lang:es
// npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_au-en.channels.xml --set=region:au --set=lang:en
// npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_nz-en.channels.xml --set=region:nz --set=lang:en
// npm run grab -- --site=beinsports.com

const { parser, url } = require('./beinsports.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-10-22T00:00:00.000', '"YYYY-MM-DDTHH:mm:ss.SSS').startOf('d')
const channel = { site_id: 'C244C48D-3B54-406A-94C9-D63B16318267', xmltv_id: 'beINSportsUSA.us' }

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://www.beinsports.com/api/opta/tv-event?&startBefore=2023-10-23T00:00:00.000Z&endAfter=2023-10-22T00:00:00.000Z&channelIds=C244C48D-3B54-406A-94C9-D63B16318267'
  )
})

const content =
  '{"count":1,"rows":[{"data":{"eventId":"2028126","eventDate":"2023-10-21T10:30:00","utcEventDate":"2023-10-20T23:30:00","duration":"90","programId":"106230","programTypeId":"5","title":"ATP 500"},"duration":5400000,"title":"Tokyo Day 5 QF 2","startDate":"2023-10-20T23:30:00.000Z","endDate":"2023-10-21T01:00:00.000Z","description":"Exclusive coverage of the 2023 ATP Tour on beIN SPORTS","channelId":"164C0EDA-EBCE-4AA6-9DDA-D603E0948B9F"}]}'

it('can parse response', () => {
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2023-10-20T23:30:00.000Z',
      stop: '2023-10-21T01:00:00.000Z',
      title: 'Tokyo Day 5 QF 2',
      description: 'Exclusive coverage of the 2023 ATP Tour on beIN SPORTS'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '[]'
  })
  expect(result).toMatchObject([])
})
