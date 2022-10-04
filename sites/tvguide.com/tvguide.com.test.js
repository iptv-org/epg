// npx epg-grabber --config=sites/tvguide.com/tvguide.com.config.js --channels=sites/tvguide.com/tvguide.com_us.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tvguide.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-10-04', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '9100001138#9233011874',
  xmltv_id: 'ABCEast.us'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://cmg-prod.apigee.net/v1/xapi/tvschedules/tvguide/9100001138/web?start=1664841600&duration=1439&channelSourceIds=9233011874'
  )
})

it('can parse response', () => {
  const content = `{"data":{"duration":"1439","providerId":"9100001138","startTime":"1664841600","items":[{"channel":{"fullName":"ABC","name":"ABC","number":null,"sourceId":9233011874,"legacySourceId":5942,"networkName":"ABC","networkId":2,"logo":"/provider/1/4/1-4124037679.png"},"programSchedules":[{"airingAttrib":533524,"catId":5,"startTime":1664841600,"endTime":1664848800,"programId":6033556709,"title":"Bachelor in Paradise","rating":"TV-14","programDetails":"https://cmg-prod.apigee.net/v1/xapi/tvschedules/tvguide/programdetails/6033556709/web"}]}]}}`

  const result = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-10-04T00:00:00.000Z',
      stop: '2022-10-04T02:00:00.000Z',
      title: 'Bachelor in Paradise'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"data":{"duration":"1439","providerId":"9100001138","startTime":"1664841600","items":[]},"links":{"self":{"href":"https://cmg-prod.apigee.net/v1/xapi/tvschedules/tvguide/9100001138/web?start=1664841600&duration=1439&channelSourceIds=923301187"},"prev":{"href":null},"next":{"href":"https://cmg-prod.apigee.net/v1/xapi/tvschedules/tvguide/9100001138/web?start=1664841600&duration=1439&channelSourceIds=923301187&offset=1664843039&limit=1664841600"}},"meta":{"componentName":null,"componentDisplayName":null,"componentType":null}}`
  })
  expect(result).toMatchObject([])
})
