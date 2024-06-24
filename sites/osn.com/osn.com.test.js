const { parser, url, request } = require('./osn.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-10-24', 'YYYY-MM-DD').startOf('d')
const channelAR = { site_id: 'AAN', xmltv_id: 'AlAanTV.ae', lang: 'ar' }
const channelEN = { site_id: 'AAN', xmltv_id: 'AlAanTV.ae', lang: 'en' }
const content =
  '[{"IsPlaying":"0","Durationtime":null,"StartMinute":0,"EndMinute":0,"EmptyDivWidth":1152,"TotalDivWidth":576,"IsTodayDate":false,"IsLastRow":false,"StartDateTime":"24 Oct 2021, 22:00","EndDateTime":"\\/Date(-62135596800000)\\/","Title":"Al Aan TV","Arab_Title":"تلفزيون الآن","GenreEnglishName":null,"GenreArabicName":null,"ChannelNumber":140,"ChannelCode":"AAN","Duration":"\\/Date(-62135596800000)\\/","Showtime":"\\/Date(-62135596800000)\\/","EpisodeId":738257,"ProgramType":null,"EPGUNIQID":"AAN202110271800738257"}]'

it('can generate valid request headers', () => {
  const result = request.headers({ channel: channelAR, date })
  expect(result).toMatchObject({
    Referer: 'https://www.osn.com/ar-ae/watch/tv-schedule'
  })
})

it('can generate valid url', () => {
  const result = url({ channel: channelAR, date })
  expect(result).toBe(
    'https://www.osn.com/api/TVScheduleWebService.asmx/time?dt=10%2F24%2F2021&co=AE&ch=AAN&mo=false&hr=0'
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
  const result = parser({ date, channel: channelAR, content: '[]' })
  expect(result).toMatchObject([])
})
