// npx epg-grabber --config=sites/mako.co.il/mako.co.il.config.js --channels=sites/mako.co.il/mako.co.il.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./mako.co.il.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-07', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'Keshet12.il'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.mako.co.il/AjaxPage?jspName=EPGResponse.jsp')
})

it('can parse response', () => {
  const content = `{"programs":[{"DisplayEndTime":"06:15","MakoTVURL":"","HouseNumber":"L17165475","StartTimeUTC":1646539200000,"DurationMs":900000,"DisplayStartTime":"06:00","MobilePicture":"https://img.mako.co.il/2017/01/01/placeHolder.jpg","StartTime":"06/03/2022 06:00:00","RerunBroadcast":false,"Duration":"00:15","ProgramName":"כותרות הבוקר","Date":"06/03/2022 06:00:00","MakoProgramsURL":"","LiveBroadcast":true,"ProgramCode":134987,"Episode":"","Picture":"https://img.mako.co.il//2021/08/04/hadshot_haboker_im_niv_raskin.jpg","MakoShortName":"","hebrewDate":"6 במרץ","Season":"","day":"הערב","EventDescription":"","EnglishName":"cotrot,EP 46"},{"DisplayEndTime":"02:39","MakoTVURL":"","HouseNumber":"A168960","StartTimeUTC":1646613480000,"DurationMs":60000,"DisplayStartTime":"02:38","MobilePicture":"https://img.mako.co.il/2017/01/01/placeHolder.jpg","StartTime":"07/03/2022 02:38:00","RerunBroadcast":true,"Duration":"00:01","ProgramName":"רוקדים עם כוכבים - בר זומר","Date":"07/03/2022 02:38:00","MakoProgramsURL":"","LiveBroadcast":false,"ProgramCode":135029,"Episode":"","Picture":"https://img.mako.co.il/2022/02/13/DancingWithStars2022_EPG.jpg","MakoShortName":"","hebrewDate":"7 במרץ","Season":"","day":"מחר","EventDescription":"מהדורת החדשות המרכזית של הבוקר, האנשים הפרשנויות והכותרות שיעשו את היום.","EnglishName":"rokdim,EP 10"}]}`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-07T00:38:00.000Z',
      stop: '2022-03-07T00:39:00.000Z',
      title: 'רוקדים עם כוכבים - בר זומר',
      description: 'מהדורת החדשות המרכזית של הבוקר, האנשים הפרשנויות והכותרות שיעשו את היום.',
      icon: 'https://img.mako.co.il/2022/02/13/DancingWithStars2022_EPG.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `[]`,
    date
  })
  expect(result).toMatchObject([])
})
