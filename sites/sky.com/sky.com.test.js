// npx epg-grabber --config=sites/sky.com/sky.com.config.js --channels=sites/sky.com/sky.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./sky.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-12-15', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2002',
  xmltv_id: 'BBCOneLondon.uk'
}
const content = `{"listings":{"2002":[{"s":1639446600,"t":"Question of Sport","audioDescription":false,"m":[27170,1800,1,1,"--"],"rr":"S","subtitleHearing":true,"sid":53228,"d":"14/36. In this Christmas special, Paddy, Sam and Ugo are joined by Anton Du Beke, Shaun Wallace, Big Zuu and Jules Breach. Also in HD. [S]","img":"lisa/5.2.2/linear/channel/7f80ef03-3d8a-4f73-bf7d-6b03f410c7a8/2002"},{"s":1639448400,"t":"Weather for the Week Ahead","audioDescription":false,"m":[27171,300,1,1,"--"],"rr":"S","subtitleHearing":true,"sid":64799,"d":"Detailed weather forecast. Also in HD. [S]","img":"lisa/5.2.2/linear/channel/8fcf08b7-4081-499a-bf63-d100908e2d75/2002"}]}}`

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://epgservices.sky.com/5.2.2/api/2.0/channel/json/2002/1639526400/86400/4'
  )
})

it('can parse response', () => {
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-12-14T01:50:00.000Z',
      stop: '2021-12-14T02:20:00.000Z',
      title: 'Question of Sport',
      icon: 'http://epgstatic.sky.com/epgdata/1.0/paimage/46/1/lisa/5.2.2/linear/channel/7f80ef03-3d8a-4f73-bf7d-6b03f410c7a8/2002'
    },
    {
      start: '2021-12-14T02:20:00.000Z',
      stop: '2021-12-14T02:25:00.000Z',
      title: 'Weather for the Week Ahead',
      icon: 'http://epgstatic.sky.com/epgdata/1.0/paimage/46/1/lisa/5.2.2/linear/channel/8fcf08b7-4081-499a-bf63-d100908e2d75/2002'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"listings":{"2002":[]}}`
  })
  expect(result).toMatchObject([])
})
