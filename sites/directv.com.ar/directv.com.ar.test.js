// npx epg-grabber --config=sites/directv.com.ar/directv.com.ar.config.js --channels=sites/directv.com.ar/directv.com.ar.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./directv.com.ar.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-06-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '207#A&amp;EHD',
  xmltv_id: 'AEHDSouth.us'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.directv.com.ar/guia/ChannelDetail.aspx/GetProgramming')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/json; charset=UTF-8',
    Cookie: 'PGCSS=16; PGLang=S; PGCulture=es-AR;'
  })
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    filterParameters: {
      day: 19,
      time: 0,
      minute: 0,
      month: 6,
      year: 2022,
      offSetValue: 0,
      filtersScreenFilters: [''],
      isHd: '',
      isChannelDetails: 'Y',
      channelNum: '207',
      channelName: 'A&EHD'
    }
  })
})

it('can parse response', () => {
  const content = `{"d":[{"ChannelSection":"","ChannelFullName":"A&E HD","IsFavorite":false,"ChannelName":"A&EHD","ChannelNumber":207,"ProgramList":[{"_channelSection":"","eventId":"120289890767","titleId":"SH0110397700000001","title":"Chicas guapas","programId":null,"description":"Un espacio destinado a la belleza y los distintos estilos de vida, que muestra el trabajo inspiracional de la moda latinoamericana.","episodeTitle":null,"channelNumber":120,"channelName":"AME2","channelFullName":"América TV (ARG)","channelSection":"","contentChannelID":120,"startTime":"/Date(-62135578800000)/","endTime":"/Date(-62135578800000)/","GMTstartTime":"/Date(-62135578800000)/","GMTendTime":"/Date(-62135578800000)/","css":16,"language":null,"tmsId":"SH0110397700000001","rating":"NR","categoryId":"Tipos de Programas","categoryName":0,"subCategoryId":0,"subCategoryName":"Series","serviceExpiration":"/Date(-62135578800000)/","crId":null,"promoUrl1":null,"promoUrl2":null,"price":0,"isPurchasable":"N","videoUrl":"","imageUrl":"https://dnqt2wx2urq99.cloudfront.net/ondirectv/LOGOS/Canales/AR/120.png","titleSecond":"Chicas guapas","isHD":"N","DetailsURL":null,"BuyURL":null,"ProgramServiceId":null,"SearchDateTime":null,"startTimeString":"6/19/2022 12:00:00 AM","endTimeString":"6/19/2022 12:15:00 AM","DurationInMinutes":null,"castDetails":null,"scheduleDetails":null,"seriesDetails":null,"processedSeasonDetails":null}]}]}`
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-06-19T03:00:00.000Z',
      stop: '2022-06-19T03:15:00.000Z',
      title: 'Chicas guapas',
      description:
        'Un espacio destinado a la belleza y los distintos estilos de vida, que muestra el trabajo inspiracional de la moda latinoamericana.',
      rating: {
        system: 'MPA',
        value: 'NR'
      }
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: ``,
    channel
  })
  expect(result).toMatchObject([])
})
