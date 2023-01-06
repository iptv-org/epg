// npx epg-grabber --config=sites/maxtv.hrvatskitelekom.hr/maxtv.hrvatskitelekom.hr.config.js --channels=sites/maxtv.hrvatskitelekom.hr/maxtv.hrvatskitelekom.hr.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./maxtv.hrvatskitelekom.hr.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-16', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '316',
  xmltv_id: '24KitchenCroatia.hr'
}
const content = `{"status":{"code":200,"message":"OK","authType":"Unauthenticated","ottSessionToken":null},"data":[{"channelId":"316","title":"24Kitchen","logo":"http://ottepg5.nexttv.ht.hr:33200/EPG/jsp/images/universal/film/logo/fileEntity/20161109/000200/XTV100002173/493d03f8-0f08-4932-8371-e5b57d96f17d.png","chanNumber":500,"hasCatchup":false,"ottChannel":true,"userSubscribed":false,"shows":[{"showId":"-1","title":"Nema informacija","startTime":1636952400,"endTime":1636967400,"category":"ostalo","hasReminder":false,"hasRecording":false,"hasSeriesRecording":false,"userOttPlayable":false,"userLocked":false,"isPPV":false,"buyPrice":""},{"showId":"17298142","title":"Najčudniji svjetski restorani","startTime":1636952400,"endTime":1636952700,"category":"Kulinarski","hasReminder":false,"hasRecording":false,"hasSeriesRecording":false,"userOttPlayable":false,"userLocked":false,"isPPV":false,"buyPrice":""}]}]}`

it('can generate valid url', () => {
  expect(url).toBe('https://player.maxtvtogo.tportal.hr:8082/OTT4Proxy/proxy/epg/shows')
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    channelList: ['316'],
    startDate: 1637020800,
    endDate: 1637107200
  })
})

it('can parse response', () => {
  const result = parser({ channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-15T05:00:00.000Z',
      stop: '2021-11-15T05:05:00.000Z',
      title: 'Najčudniji svjetski restorani',
      category: 'Kulinarski'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"status":{"code":200,"message":"OK","authType":"Unauthenticated","ottSessionToken":null},"data":[]}`
  })
  expect(result).toMatchObject([])
})
