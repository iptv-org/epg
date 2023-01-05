// npm run channels:parse -- --config=sites/startv.com/startv.com.config.js --output=sites/startv.com/startv.com.channels.xml
// npx epg-grabber --config=sites/startv.com/startv.com.config.js --channels=sites/startv.com/startv.com.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./startv.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-31', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'STAR PLUS',
  xmltv_id: 'StarPlus.in'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.startv.com/umbraco/api/startvguideproxy/GetTvGuideSchedule')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/json; charset=UTF-8'
  })
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    Channels: 'STAR PLUS',
    Start: '202203310000',
    Stop: '202204010000'
  })
})

it('can parse response', () => {
  const content = `"{\\"ScheduleGrid\\":{\\"channel\\":[{\\"id\\":null,\\"displayname\\":null,\\"channelid\\":\\"10000000000080000\\",\\"channellogourl\\":\\"http://imagesstartv.whatsonindia.com/dasimages/channel/landscape/100x75/wHtcYVRZ.png\\",\\"channelgenre\\":\\"Hindi Entertainment\\",\\"channelweburl\\":\\"\\",\\"channeldisplayname\\":\\"STAR PLUS\\",\\"lcn\\":\\"1\\",\\"isfav\\":\\"0\\",\\"programme\\":[{\\"programmeid\\":\\"30000000550792674\\",\\"title\\":\\"Imlie\\",\\"start\\":\\"202203310000\\",\\"stop\\":\\"202203310030\\",\\"desc\\":\\"Imlie finds herself in deep trouble when she gets tied up before the wedding. Meanwhile, Aryan assumes that he is getting married to Imlie and performs the wedding rituals.\\",\\"programmeurl\\":\\"http://imagesstartv.whatsonindia.com/dasimages/landscape/360x270/59A9215E5DE13ABF4B05C59A6C87768AD61CA608M.jpg\\",\\"channelid\\":\\"10000000000080000\\",\\"date\\":\\"20220331\\",\\"episodenum\\":null,\\"subtitle\\":null,\\"scheduleid\\":\\"10000069158583187\\",\\"genre\\":\\"TV Show\\",\\"subgenre\\":\\"Drama\\",\\"programmescore\\":\\"0.083309\\",\\"languagename\\":\\"Hindi\\",\\"dubbedlanguageid\\":\\"10000000000040000\\",\\"timestring\\":\\"12:00 AM, Tomorrow\\",\\"duration\\":\\"30\\",\\"episodeshorttitle\\":\\"\\"}]}]}}"`
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-30T18:30:00.000Z',
      stop: '2022-03-30T19:00:00.000Z',
      title: 'Imlie',
      description:
        'Imlie finds herself in deep trouble when she gets tied up before the wedding. Meanwhile, Aryan assumes that he is getting married to Imlie and performs the wedding rituals.',
      icon: 'http://imagesstartv.whatsonindia.com/dasimages/landscape/360x270/59A9215E5DE13ABF4B05C59A6C87768AD61CA608M.jpg',
      category: 'Drama'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `""`
  })
  expect(result).toMatchObject([])
})
