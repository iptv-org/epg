// NODE_OPTIONS=--insecure-http-parser npx epg-grabber --config=sites/osn.com/osn.com.config.js --channels=sites/osn.com/osn.com.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./osn.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-10-24', 'YYYY-MM-DD').startOf('d')
const channelAR = { site_id: 'AAN', xmltv_id: 'AlAanTV.ae', lang: 'ar' }
const channelEN = { site_id: 'AAN', xmltv_id: 'AlAanTV.ae', lang: 'en' }
const content = JSON.stringify({
  d: '[{"IsPlaying":"0","Durationtime":null,"StartMinute":0,"EndMinute":0,"EmptyDivWidth":1152,"TotalDivWidth":576,"IsTodayDate":false,"IsLastRow":false,"StartDateTime":"24 Oct 2021, 22:00","EndDateTime":"\\/Date(-62135596800000)\\/","Title":"Al Aan TV","Arab_Title":"تلفزيون الآن","GenreEnglishName":null,"GenreArabicName":null,"ChannelNumber":140,"ChannelCode":"AAN","Duration":"\\/Date(-62135596800000)\\/","Showtime":"\\/Date(-62135596800000)\\/","EpisodeId":738257,"ProgramType":null,"EPGUNIQID":"AAN202110271800738257"}]'
})

it('can generate valid request data', () => {
  const result = request.data({ channel: channelAR, date })
  expect(result).toMatchObject({
    newDate: '10/24/2021',
    selectedCountry: 'AE',
    channelCode: 'AAN',
    isMobile: false,
    hoursForMobile: 0
  })
})

it('can generate valid request headers', () => {
  const result = request.headers
  expect(result).toMatchObject({
    'Content-Type': 'application/json; charset=UTF-8',
    Referer: 'https://www.osn.com'
  })
})

it('can generate valid url', () => {
  expect(url).toBe(
    'https://www.osn.com/CMSPages/TVScheduleWebService.asmx/GetTVChannelsProgramTimeTable'
  )
})

it('can parse response (ar)', () => {
  const result = parser({ date, channel: channelAR, content })
  expect(result).toMatchObject([
    {
      start: 'Sun, 24 Oct 2021 18:00:00 GMT',
      stop: 'Sun, 24 Oct 2021 20:00:00 GMT',
      title: 'تلفزيون الآن',
      category: null
    }
  ])
})

it('can parse response (en)', () => {
  const result = parser({ date, channel: channelEN, content })
  expect(result).toMatchObject([
    {
      start: 'Sun, 24 Oct 2021 18:00:00 GMT',
      stop: 'Sun, 24 Oct 2021 20:00:00 GMT',
      title: 'Al Aan TV',
      category: null
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({ date, channel: channelAR, content: JSON.stringify({ d: '[]' }) })
  expect(result).toMatchObject([])
})
