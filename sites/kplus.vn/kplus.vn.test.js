// npm run channels:parse -- --config=sites/kplus.vn/kplus.vn.config.js --output=sites/kplus.vn/kplus.vn.channels.xml
// npx epg-grabber --config=sites/kplus.vn/kplus.vn.config.js --channels=sites/kplus.vn/kplus.vn.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./kplus.vn.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-15', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '7019',
  xmltv_id: 'KPlus1HD.vn'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.kplus.vn/Schedule/getSchedule')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded'
  })
})

it('can generate valid request data', () => {
  const data = request.data({ date })

  expect(data.get('date')).toBe('15-3-2022')
  expect(data.get('categories')).toBe('')
})

it('can parse response', () => {
  const content = `{"SchedulesCount":1105,"ChannelsCount":28,"Schedules":[{"Id":12195,"ChannelId":7019,"ProgramId":35111026,"EpgProgramId":"1252496\\r","ShowingTime":"2022-03-15T06:15:00","EpgBroadcastId":"HD_ENT_DOC_LNO_21_2649421_2652183_4383385_OnAir","EpgId":"HD_ENT_DOC_LNO_21_2649421_2652183_4383385_OnAir","IsDeleted":false,"CreatedOn":"2022-03-15T06:22:45","UpdatedOn":"0001-01-01T00:00:00","Channel":{"Id":7019,"Name":"K+1 HD","Image":"https://kplus-website-production-cdn.azureedge.net/content/upload/7/images-mkt/logo-k-1-hd-new.png","LiveUrlSegment":"highlights/broadcast-schedule/K-1-HD","FeatureImage":"https://kplus-website-production-cdn.azureedge.net/content/upload/7/images-mkt/logo-k-1-hd-new.png","EpgId":null,"IsOTTEnabled":false,"StartOver":0,"DisplayOrder":0},"Program":{"Id":35111026,"Name":"WEEKLY FILMS AND STARS, EP740","BodyContent":"","Cast":"","Director":"","Duration":0,"EpgId":"93701","EpgProgramId":null,"Episode":0,"Genres":"Documentary","Images":"https://img.kplus.vn/images?filename=Media/HDVN/2022_02/ENT_DOC_LNO_21_2649421_2652183_2652183.jpg","IsFeatured":false,"IsOTTEnabled":true,"IsRebroadcast":false,"ShortDescription":"","SubTitle":"","Trailers":"","UrlSegment":"highlights/broadcast-schedule/93701/weekly-films-and-stars-ep740","CreatedOn":"2022-03-16T00:15:45","UpdatedOn":"2022-03-16T00:15:45","ParentalRating":null},"RelatedSchedules":null},{"Id":12196,"ChannelId":7019,"ProgramId":35111279,"EpgProgramId":"798685\\r","ShowingTime":"2022-03-15T07:00:00","EpgBroadcastId":"HD_MOV_COM__2632318_4383386_OnAir","EpgId":"HD_MOV_COM__2632318_4383386_OnAir","IsDeleted":false,"CreatedOn":"2022-03-15T07:02:46","UpdatedOn":"0001-01-01T00:00:00","Channel":{"Id":7019,"Name":"K+1 HD","Image":"https://kplus-website-production-cdn.azureedge.net/content/upload/7/images-mkt/logo-k-1-hd-new.png","LiveUrlSegment":"highlights/broadcast-schedule/K-1-HD","FeatureImage":"https://kplus-website-production-cdn.azureedge.net/content/upload/7/images-mkt/logo-k-1-hd-new.png","EpgId":null,"IsOTTEnabled":false,"StartOver":0,"DisplayOrder":0},"Program":{"Id":35111279,"Name":"ST. VINCENT","BodyContent":"","Cast":"Bill Murray, Melissa McCarthy, Naomi Watts","Director":"Theodore Melfi","Duration":0,"EpgId":"93959","EpgProgramId":null,"Episode":0,"Genres":"Comedy","Images":"https://img.kplus.vn/images?filename=Media/HDVN/2020_05/MOV_COM__2632318_2632318.jpg","IsFeatured":false,"IsOTTEnabled":true,"IsRebroadcast":false,"ShortDescription":"","SubTitle":"","Trailers":"","UrlSegment":"highlights/broadcast-schedule/93959/st-vincent","CreatedOn":"2022-03-16T00:15:45","UpdatedOn":"2022-03-16T00:15:45","ParentalRating":null},"RelatedSchedules":null}]}`
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-14T23:15:00.000Z',
      stop: '2022-03-15T00:00:00.000Z',
      title: 'WEEKLY FILMS AND STARS, EP740',
      icon: 'https://img.kplus.vn/images?filename=Media/HDVN/2022_02/ENT_DOC_LNO_21_2649421_2652183_2652183.jpg',
      category: 'Documentary'
    },
    {
      start: '2022-03-15T00:00:00.000Z',
      stop: '2022-03-15T01:00:00.000Z',
      title: 'ST. VINCENT',
      icon: 'https://img.kplus.vn/images?filename=Media/HDVN/2020_05/MOV_COM__2632318_2632318.jpg',
      category: 'Comedy'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"SchedulesCount":0,"ChannelsCount":0,"Schedules":[],"Channels":[],"MinDuration":0}`,
    channel
  })
  expect(result).toMatchObject([])
})
