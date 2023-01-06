// npx epg-grabber --config=sites/frikanalen.no/frikanalen.no.config.js --channels=sites/frikanalen.no/frikanalen.no.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./frikanalen.no.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-01-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'Frikanalen.no'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://frikanalen.no/api/scheduleitems/?date=2022-01-19&format=json&limit=100'
  )
})

it('can parse response', () => {
  const content = `{"count":83,"next":null,"previous":null,"results":[{"id":135605,"video":{"id":626094,"name":"FSCONS 2017 - Keynote: TBA - Linda Sandvik","header":"Linda Sandvik's keynote at FSCONS 2017\\r\\n\\r\\nRecorded by NUUG for FSCONS.","description":null,"creator":"davidwnoble@gmail.com","organization":{"id":82,"name":"NUUG","homepage":"https://www.nuug.no/","description":"Forening NUUG er for alle som er interessert i fri programvare, åpne standarder og Unix-lignende operativsystemer.","postalAddress":"","streetAddress":"","editorId":2148,"editorName":"David Noble","editorEmail":"davidwnoble@gmail.com","editorMsisdn":"","fkmember":true},"duration":"00:57:55.640000","categories":["Samfunn"]},"schedulereason":5,"starttime":"2022-01-19T00:47:00+01:00","endtime":"2022-01-19T01:44:55.640000+01:00","duration":"00:57:55.640000"}]}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-01-18T23:47:00.000Z',
      stop: '2022-01-19T00:44:55.640Z',
      title: `FSCONS 2017 - Keynote: TBA - Linda Sandvik`,
      category: ['Samfunn'],
      description: `Linda Sandvik's keynote at FSCONS 2017\r\n\r\nRecorded by NUUG for FSCONS.`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"count":0,"next":null,"previous":null,"results":[]}`
  })
  expect(result).toMatchObject([])
})
