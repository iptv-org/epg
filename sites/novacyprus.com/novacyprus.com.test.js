// node ./scripts/channels.js --config=./sites/novacyprus.com/novacyprus.com.config.js --output=./sites/novacyprus.com/novacyprus.com.channels.xml
// npx epg-grabber --config=sites/novacyprus.com/novacyprus.com.config.js --channels=sites/novacyprus.com/novacyprus.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./novacyprus.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '614',
  xmltv_id: 'NovaCinema1.gr'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://www.novacyprus.com/api/v1/tvprogram/from/20211117/to/20211118'
  )
})

it('can parse response', () => {
  const content = `{"nodes":[{"datetime":"2021-11-17 06:20:00","day":"Wednesday","numDay":17,"numMonth":11,"month":"November","channelName":"Cyprus Novacinema1HD","channelLog":"https:\/\/ssl2.novago.gr\/EPG\/jsp\/images\/universal\/film\/logo\/20200210\/000100\/XTV100000762\/d6a2f5e0-dbc0-49c7-9843-e3161ca5ae5d.png","cid":"42","ChannelId":"614","startingTime":"06:20","endTime":"08:10","title":"Δεσμοί Αίματος","description":"Θρίλερ Μυστηρίου","duration":"109","slotDuration":"110","bref":"COMMOBLOOX","mediaItems":[{"MediaListTypeId":"6","CdnUrl":"http:\/\/cache-forthnet.secure.footprint.net\/linear\/3\/0\/305608_COMMOBLOOX_GUIDE_STILL.jpg"},{"MediaListTypeId":"7","CdnUrl":"http:\/\/cache-forthnet.secure.footprint.net\/linear\/3\/0\/305608_COMMOBLOOX_POSTER_CROSS.jpg"},{"MediaListTypeId":"8","CdnUrl":"http:\/\/cache-forthnet.secure.footprint.net\/linear\/3\/0\/305608_COMMOBLOOX_ICON_CYP.jpg"},{"MediaListTypeId":"9","CdnUrl":"http:\/\/cache-forthnet.secure.footprint.net\/linear\/3\/0\/305608_COMMOBLOOX_POSTER_CYP.jpg"},{"MediaListTypeId":"10","CdnUrl":"http:\/\/cache-forthnet.secure.footprint.net\/linear\/3\/0\/305608_COMMOBLOOX_BACKGROUND_CYP.jpg"}]},{"datetime":"2021-11-17 06:00:00","day":"Wednesday","numDay":17,"numMonth":11,"month":"November","channelName":"Cyprus Novacinema2HD","channelLog":"https:\/\/ssl2.novago.gr\/EPG\/jsp\/images\/universal\/film\/logo\/20200210\/000100\/XTV100000763\/24e05354-d6ad-4949-bcb3-a81d1c1d2cba.png","cid":"62","ChannelId":"653","startingTime":"06:00","endTime":"07:40","title":"Ανυπόφοροι Γείτονες","description":"Κωμωδία","duration":"93","slotDuration":"100","bref":"NEIGHBORSX","mediaItems":[{"MediaListTypeId":"7","CdnUrl":"http:\/\/cache-forthnet.secure.footprint.net\/linear\/3\/1\/312582_NEIGHBORSX_POSTER_CROSS.jpg"},{"MediaListTypeId":"8","CdnUrl":"http:\/\/cache-forthnet.secure.footprint.net\/linear\/3\/1\/312582_NEIGHBORSX_ICON_CYP.jpg"},{"MediaListTypeId":"9","CdnUrl":"http:\/\/cache-forthnet.secure.footprint.net\/linear\/3\/1\/312582_NEIGHBORSX_POSTER_CYP.jpg"},{"MediaListTypeId":"10","CdnUrl":"http:\/\/cache-forthnet.secure.footprint.net\/linear\/3\/1\/312582_NEIGHBORSX_BACKGROUND_CYP.jpg"}]}]}`
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-17T04:20:00.000Z',
      stop: '2021-11-17T06:10:00.000Z',
      title: 'Δεσμοί Αίματος',
      description: 'Θρίλερ Μυστηρίου',
      icon: 'http://cache-forthnet.secure.footprint.net/linear/3/0/305608_COMMOBLOOX_GUIDE_STILL.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"nodes":[],"total":0,"pages":0}`
  })
  expect(result).toMatchObject([])
})
