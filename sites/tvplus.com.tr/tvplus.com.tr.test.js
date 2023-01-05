// npx epg-grabber --config=sites/tvplus.com.tr/tvplus.com.tr.config.js --channels=sites/tvplus.com.tr/tvplus.com.tr.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./tvplus.com.tr.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-07', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '32',
  xmltv_id: '24TV.tr'
}
const content = `{"counttotal":"23","playbilllist":[{"country":"","starttime":"20211107000000","type":"PROGRAM","isBlackout":"0","rerun":"0","ppvsubscribed":"0","foreignsn":"134383557","isLive":"0","ratingid":"0","episodeTotalCount":"0","id":"134383557","keyword":"24 Portre","contentType":"0","isnpvr":"1","slsType":"0","iscpvr":"0","advisory":[],"genreIds":["1179"],"istvod":"0","name":"24 Portre","tvodStatus":"0","pictures":[{"href":"https://izmottvsc23.tvplus.com.tr:33207/CPS/images/universal/film/program/202111/20211104/35/20211104000026695lh5.jpg","resolution":["null","null"],"imageType":"0"}],"externalContentCode":"105445035962202111070300","genres":"Yaşam","visittimes":"0","issubscribed":"0","programType":"program","gapFiller":"0","introduce":"Kendi alanında büyük başarılar elde etmiş insanların kendi ağzından hayat hikayeleri ekrana geliyor.","priceType":[{"value":"0","key":"BTV"},{"value":"0","key":"TVOD"}],"endtime":"20211107010000","seasonTotalCount":"0","recordedMediaIds":[],"picture":{},"isLoyalty":"0","isppv":"0","mainGenre":"0","contentRight":"[{\\"mediaId\\":\\"3000435\\",\\"businessType\\":\\"13\\",\\"enable\\":\\"0\\"},{\\"mediaId\\":\\"3000435\\",\\"businessType\\":\\"14\\",\\"enable\\":\\"0\\"},{\\"mediaId\\":\\"3000435\\",\\"businessType\\":\\"15\\",\\"enable\\":\\"1\\"},{\\"mediaId\\":\\"100067919\\",\\"businessType\\":\\"13\\",\\"enable\\":\\"0\\"},{\\"mediaId\\":\\"100067919\\",\\"businessType\\":\\"14\\",\\"enable\\":\\"0\\"},{\\"mediaId\\":\\"100067919\\",\\"businessType\\":\\"15\\",\\"enable\\":\\"1\\"}]","channelid":"32"}],"playbillVersion":[{"channelId":"32","date":"20211108","version":"20211106000043"},{"channelId":"32","date":"20211107","version":"20211105000027"}]}`

it('can generate valid url', () => {
  expect(url).toBe('https://izmottvsc23.tvplus.com.tr:33207/EPG/JSON/PlayBillList')
})

it('can generate valid request data', () => {
  const result = request.data({ date, channel })
  expect(result).toMatchObject({
    type: '2',
    channelid: '32',
    begintime: '20211107000000',
    endtime: '20211108000000'
  })
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: '2021-11-07T00:00:00.000Z',
      stop: '2021-11-07T01:00:00.000Z',
      title: '24 Portre',
      category: 'Yaşam',
      icon: 'https://izmottvsc23.tvplus.com.tr:33207/CPS/images/universal/film/program/202111/20211104/35/20211104000026695lh5.jpg',
      description: `Kendi alanında büyük başarılar elde etmiş insanların kendi ağzından hayat hikayeleri ekrana geliyor.`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"counttotal":"0","playbilllist":[],"playbillVersion":[{"channelId":"10000","date":"20211108","version":"20211107163253"},{"channelId":"10000","date":"20211107","version":"20211107163253"}]}`
  })
  expect(result).toMatchObject([])
})
