// npm run channels:parse -- --config=sites/starhubtvplus.com/starhubtvplus.com.config.js --output=sites/starhubtvplus.com/starhubtvplus.com.channels.xml
// npx epg-grabber --config=sites/starhubtvplus.com/starhubtvplus.com.config.js --channels=sites/starhubtvplus.com/starhubtvplus.com.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./starhubtvplus.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-05-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '102',
  xmltv_id: 'Channel5.sg'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://api.starhubtvplus.com/epg?operationName=webFilteredEpg&variables=%7B%22category%22%3A%22%22%2C%22dateFrom%22%3A%222022-05-10%22%2C%22dateTo%22%3A%222022-05-11%22%7D&query=query%20webFilteredEpg(%24category%3A%20String%2C%20%24dateFrom%3A%20DateWithoutTime%2C%20%24dateTo%3A%20DateWithoutTime!)%20%7B%20nagraEpg(category%3A%20%24category)%20%7B%20items%20%7B%20id%3A%20tvChannel%20image%20name%3A%20longName%20programs%3A%20programsByDate(dateFrom%3A%20%24dateFrom%2C%20dateTo%3A%20%24dateTo)%20%7B%20id%20title%20description%20Categories%20startTime%20endTime%20%7D%7D%7D%7D'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'x-application-key': '5ee2ef931de1c4001b2e7fa3_5ee2ec25a0e845001c1783dc',
    'x-application-session': '01G2QG0N3RWDNCBA1S5MK1MD2K17CE4431A2'
  })
})

it('can generate valid cache settings', () => {
  expect(request.cache).toMatchObject({
    ttl: 60 * 60 * 1000
  })
})

it('can parse response', () => {
  const content = `{"data":{"nagraEpg":{"items":[{"id":102,"name":"Channel 5 HD_DASH","programs":[{"id":"GLOBAL_TC0021650123","title":"Luke Nguyen's Vietnam","description":"Luke leaves the hustle and bustle of Hanoi behind for the mystical mountains of Sapa. There, he prepares some black chicken in and amongst the local streets. He cooks buffalo for a salad in the busy Sapa markets, as well as a tofu-and-tomato dish high up in the rice paddy fields with the most spectacular backdrop.","Categories":["Others"],"startTime":1652110200000,"endTime":1652112000000}]}]}}}`
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-05-09T15:30:00.000Z',
      stop: '2022-05-09T16:00:00.000Z',
      title: "Luke Nguyen's Vietnam",
      description:
        'Luke leaves the hustle and bustle of Hanoi behind for the mystical mountains of Sapa. There, he prepares some black chicken in and amongst the local streets. He cooks buffalo for a salad in the busy Sapa markets, as well as a tofu-and-tomato dish high up in the rice paddy fields with the most spectacular backdrop.',
      category: ['Others']
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"errors":[{"code":"A9999","message":"Syntax, request headers or server error","extendedLogging":{"message":"Cannot read property 'operation' of undefined"}}]}`
  })
  expect(result).toMatchObject([])
})
