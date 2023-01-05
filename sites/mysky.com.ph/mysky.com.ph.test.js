// npx epg-grabber --config=sites/mysky.com.ph/mysky.com.ph.config.js --channels=sites/mysky.com.ph/mysky.com.ph.channels.xml --output=guide.xml --days=2
// npm run channels:parse -- --config=./sites/mysky.com.ph/mysky.com.ph.config.js --output=./sites/mysky.com.ph/mysky.com.ph.channels.xml

const { parser, url } = require('./mysky.com.ph.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-10-04', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '8',
  xmltv_id: 'KapamilyaChannel.ph'
}

it('can generate valid url', () => {
  expect(url).toBe('https://skyepg.mysky.com.ph/Main/getEventsbyType')
})

it('can parse response', () => {
  const content = `{"events":[{"name":"TV PATROL","location":"8","start":"2022/10/04 19:00","end":"2022/10/04 20:00","userData":{"description":"Description example"}},{"name":"DARNA","location":"8","start":"2022/10/05 20:00","end":"2022/10/05 20:45","userData":{"description":""}},{"name":"Zoe Bakes S1","location":"22","start":"2022/10/04 20:30","end":"2022/10/04 21:00","userData":{"description":"Zo Franois Dad is a beekeeper. So for his birthday, she bakes him a special beehiveshaped cake."}}]}`
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-10-04T11:00:00.000Z',
      stop: '2022-10-04T12:00:00.000Z',
      title: 'TV PATROL',
      description: 'Description example'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: ``,
    channel,
    date
  })
  expect(result).toMatchObject([])
})
