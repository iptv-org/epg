// node ./scripts/channels.js --config=./sites/teliatv.ee/teliatv.ee.config.js --output=./sites/teliatv.ee/teliatv.ee.channels.xml --set=lang:et
// npx epg-grabber --config=sites/teliatv.ee/teliatv.ee.config.js --channels=sites/teliatv.ee/teliatv.ee.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./teliatv.ee.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-20', 'YYYY-MM-DD').startOf('d')
const channel = {
  lang: 'et',
  site_id: 'et#1',
  xmltv_id: 'ETV.ee'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://api.teliatv.ee/dtv-api/3.2/et/epg/guide?channelIds=1&relations=programmes&images=webGuideItemLarge&startAt=2021-11-21T00:00&startAtOp=lte&endAt=2021-11-20T00:00&endAtOp=gt'
  )
})

it('can generate valid url with different language', () => {
  const ruChannel = {
    lang: 'ru',
    site_id: 'ru#1',
    xmltv_id: 'ETV.ee'
  }
  expect(url({ date, channel: ruChannel })).toBe(
    'https://api.teliatv.ee/dtv-api/3.2/ru/epg/guide?channelIds=1&relations=programmes&images=webGuideItemLarge&startAt=2021-11-21T00:00&startAtOp=lte&endAt=2021-11-20T00:00&endAtOp=gt'
  )
})

it('can parse response', () => {
  const content = `{"categoryItems":{"1":[{"id":136227,"type":"epgSeries","name":"Inimjaht","originalName":"Manhunt","price":null,"owner":"ETV","ownerId":1,"images":{"webGuideItemLarge":"/resized/ri93Qj4OLXXvg7QAsUOcKMnIb3g=/570x330/filters:format(jpeg)/inet-static.mw.elion.ee/epg_images/9/b/17e48b3966e65c02.jpg"},"packetIds":[30,34,38,129,130,162,191,242,243,244,447,483,484,485,486],"related":{"programmeIds":[27224371]}}]},"relations":{"programmes":{"27224371":{"id":27224371,"startAt":"2021-11-20T00:05:00+02:00","endAt":"2021-11-20T00:55:00+02:00","publicTo":"2021-12-04T02:05:00+02:00","status":"default","channelId":1,"broadcastId":78248901,"hasMarkers":false,"catchup":false}}}}`
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-19T22:05:00.000Z',
      stop: '2021-11-19T22:55:00.000Z',
      title: `Inimjaht`,
      icon: 'https://inet-static.mw.elion.ee/resized/ri93Qj4OLXXvg7QAsUOcKMnIb3g=/570x330/filters:format(jpeg)/inet-static.mw.elion.ee/epg_images/9/b/17e48b3966e65c02.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"categoryItems":{},"relations":{}}`
  })
  expect(result).toMatchObject([])
})
