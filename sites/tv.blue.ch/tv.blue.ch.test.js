// node ./scripts/commands/parse-channels.js --config=./sites/tv.blue.ch/tv.blue.ch.config.js --output=./sites/tv.blue.ch/tv.blue.ch.channels.xml
// npx epg-grabber --config=sites/tv.blue.ch/tv.blue.ch.config.js --channels=sites/tv.blue.ch/tv.blue.ch.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tv.blue.ch.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-01-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1221',
  xmltv_id: 'BlueZoomD.ch'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://services.sg101.prd.sctv.ch/catalog/tv/channels/list/(ids=1221;start=202201170000;end=202201180000;level=normal)'
  )
})

it('can parse response', () => {
  const content = `{"Nodes":{"Count":1,"TotalItemCount":1,"Items":[{"Domain":"TV","Identifier":"1221","Kind":"Channel","Content":{"Description":{"Title":"blue Zoom D","Language":"de"},"Nodes":{"Count":29,"TotalItemCount":29,"Items":[{"Domain":"TV","Identifier":"t1221ddc59247d45","Kind":"Broadcast","Channel":"1221","Content":{"Description":{"Title":"Weekend on the Rocks","Summary":" - «R.E.S.P.E.C.T», lieber Charles Nguela. Der Comedian tourt fleissig durch die Schweiz, macht für uns aber einen Halt, um in der neuen Ausgabe von «Weekend on the Rocks» mit Moderatorin Vania Spescha über die Entertainment-News der Woche zu plaudern.","ShortSummary":"","Country":"CH","ReleaseDate":"2021-01-01T00:00:00Z","Source":"13","Language":"de","Duration":"00:30:00"},"Nodes":{"Count":1,"TotalItemCount":1,"Items":[{"Domain":"TV","Identifier":"t1221ddc59247d45_landscape","Kind":"Image","Role":"Landscape","ContentPath":"/tv/broadcast/1221/t1221ddc59247d45_landscape","Version":{"Date":"2022-01-04T08:55:22.567Z"}}]},"TechnicalAttributes":{"Stereo":true}},"Version":{"Hash":"60d3"},"Availabilities":[{"AvailabilityStart":"2022-01-16T23:30:00Z","AvailabilityEnd":"2022-01-17T00:00:00Z"}],"Relations":[{"Domain":"TV","Kind":"Reference","Role":"ChannelIdentifier","TargetIdentifier":"2b0898c7-3920-3200-7048-4ea5d9138921"},{"Domain":"TV","Kind":"Reference","Role":"OriginalAirSeries","TargetIdentifier":"false"},{"Domain":"TV","Kind":"Reference","Role":"ExternalBroadcastIdentifier","TargetIdentifier":"167324536-11"},{"Domain":"TV","Kind":"Reference","Role":"ProgramIdentifier","TargetIdentifier":"p12211351631155","Title":"Original"}]}]}}}]}}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-01-16T23:30:00.000Z',
      stop: '2022-01-17T00:00:00.000Z',
      title: 'Weekend on the Rocks',
      description:
        ' - «R.E.S.P.E.C.T», lieber Charles Nguela. Der Comedian tourt fleissig durch die Schweiz, macht für uns aber einen Halt, um in der neuen Ausgabe von «Weekend on the Rocks» mit Moderatorin Vania Spescha über die Entertainment-News der Woche zu plaudern.',
      icon: 'https://services.sg101.prd.sctv.ch/content/images/tv/broadcast/1221/t1221ddc59247d45_landscape_w1920.webp'
    }
  ])
})

it('can parse response without image', () => {
  const content = `{"Nodes":{"Count":1,"TotalItemCount":1,"Items":[{"Domain":"TV","Identifier":"1221","Kind":"Channel","Content":{"Description":{"Title":"blue Zoom D","Language":"de"},"Nodes":{"Count":29,"TotalItemCount":29,"Items":[{"Domain":"TV","Identifier":"t10014a78a8b0668","Kind":"Broadcast","Channel":"1001","Content":{"Description":{"Title":"Lorem ipsum","Language":"fr","Duration":"00:01:00"}},"Version":{"Hash":"440e"},"Availabilities":[{"AvailabilityStart":"2022-01-17T04:59:00Z","AvailabilityEnd":"2022-01-17T05:00:00Z"}],"Relations":[{"Domain":"TV","Kind":"Reference","Role":"ChannelIdentifier","TargetIdentifier":"3553a4f2-ff63-5200-7048-d8d59d805f81"},{"Domain":"TV","Kind":"Reference","Role":"Dummy","TargetIdentifier":"True"},{"Domain":"TV","Kind":"Reference","Role":"ProgramIdentifier","TargetIdentifier":"p1"}]}]}}}]}}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-01-17T04:59:00.000Z',
      stop: '2022-01-17T05:00:00.000Z',
      title: 'Lorem ipsum'
    }
  ])
})

it('can handle wrong site id', () => {
  const result = parser({
    content: `{"Status":{"Version":"7","Status":"OK","ProcessingTime":"00:00:00.0160674","ExecutionTime":"2022-01-17T13:47:30.584Z"},"Request":{"Domain":"TV","Resource":"Channels","Action":"List","Parameters":"(ids=12210;start=202201170000;end=202201180000;level=normal)","Identifiers":["12210"],"Start":"2022-01-17T00:00:00Z","End":"2022-01-18T00:00:00Z","DataLevel":"Normal"},"DataSource":{"Snapshot":"Tv_20220117114748","DbCreationTime":"2022-01-17T11:49:14.608Z","IncrementCreationTime":"0001-01-01T00:00:00Z"},"Nodes":{"Items":[]}}`
  })
  expect(result).toMatchObject([])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"Status":{"Version":"7","Status":"OK","ExecutionTime":"2022-01-17T15:30:37.97Z"},"Request":{"Domain":"TV","Resource":"Channels","Action":"List","Parameters":"(ids=1884;start=202201170000;end=202201180000;level=normal)","Identifiers":["1884"],"Start":"2022-01-17T00:00:00Z","End":"2022-01-18T00:00:00Z","DataLevel":"Normal"},"DataSource":{"Snapshot":"Tv_20220117144354","DbCreationTime":"2022-01-17T14:45:11.84Z","IncrementCreationTime":"0001-01-01T00:00:00Z"},"Nodes":{"Count":1,"TotalItemCount":1,"Items":[{"Domain":"TV","Identifier":"1884","Kind":"Channel","Content":{"Description":{"Title":"Fisu.tv 1","Language":"en"}}}]}}`
  })
  expect(result).toMatchObject([])
})
