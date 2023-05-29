// npm run channels:parse -- --config=sites/wavve.com/wavve.com.config.js --output=sites/wavve.com/wavve.com.channels.xml
// npx epg-grabber --config=sites/wavve.com/wavve.com.config.js --channels=sites/wavve.com/wavve.com.channels.xml --output=guide.xml

const { parser, url } = require('./wavve.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-04-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'K01',
  xmltv_id: 'KBS1TV.kr'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://apis.pooq.co.kr/live/epgs/channels/K01?startdatetime=2022-04-17%2000%3A00&enddatetime=2022-04-18%2000%3A00&apikey=E5F3E0D30947AA5440556471321BB6D9&limit=500'
  )
})

it('can parse response', () => {
  const content = `{"pagecount":"37","count":"37","list":[{"cpid":"C3","channelid":"K01","channelname":"KBS 1TV","channelimage":"img.pooq.co.kr/BMS/Channelimage30/image/KBS-1TV-1.jpg","scheduleid":"K01_20220416223000","programid":"","title":"특파원 보고  세계는 지금","image":"wchimg.wavve.com/live/thumbnail/K01.jpg","starttime":"2022-04-16 22:30","endtime":"2022-04-16 23:15","timemachine":"Y","license":"y","livemarks":[],"targetage":"0","tvimage":"img.pooq.co.kr/BMS/Channelimage30/image/KBS 1TV-2.png","ispreorder":"n","preorderlink":"n","alarm":"n"}]}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-04-16T13:30:00.000Z',
      stop: '2022-04-16T14:15:00.000Z',
      title: '특파원 보고  세계는 지금'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"pagecount":"0","count":"0","list":[]}`
  })
  expect(result).toMatchObject([])
})
