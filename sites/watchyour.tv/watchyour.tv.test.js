// npm run channels:parse -- --config=./sites/watchyour.tv/watchyour.tv.config.js --output=./sites/watchyour.tv/watchyour.tv.channels.xml
// npx epg-grabber --config=sites/watchyour.tv/watchyour.tv.config.js --channels=sites/watchyour.tv/watchyour.tv.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./watchyour.tv.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-10-03', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '735',
  xmltv_id: 'TVSClassicSports.us'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.watchyour.tv/guide.json')
})

it('can parse response', () => {
  const content = `[{"name":"TVS Classic Sports","icon":"https://www.watchyour.tv/epg/channellogos/tvs-classic-sports.png","language":"English","id":"735","shows":[{"name":"1979 WVU vs Penn State","category":"Sports","start_day":"2022-10-03","start":"04:00:00","end_day":"2022-10-03","end":"06:00:45","duration":"121","url":"http://rpn1.bozztv.com/36bay2/gusa-tvs/index-1664769600-7245.m3u8?token=f7410a9414f61579dced17ac1bbdb971","icon":"https://example.com/image.png","timezone":"+0000","tms":"1664769600"},{"name":"1958 NCAA University of Kentucky vs Seattle U","category":"Sports","start_day":"2022-10-04","start":"00:58:50","end_day":"2022-10-04","end":"01:44:11","duration":"46","url":"http://rpn1.bozztv.com/36bay2/gusa-tvs/index.m3u8?token=93e7b201f544c87296076b73f9d880ae","icon":"","timezone":"+0000","tms":"1664845130"}]}]`
  const result = parser({ content, date, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-10-03T04:00:00.000Z',
      stop: '2022-10-03T06:01:00.000Z',
      title: '1979 WVU vs Penn State',
      icon: 'https://example.com/image.png',
      category: 'Sports'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: ``,
    date,
    channel
  })
  expect(result).toMatchObject([])
})
