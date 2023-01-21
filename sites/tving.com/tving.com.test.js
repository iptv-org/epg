// npm run channels:parse -- --config=./sites/tving.com/tving.com.config.js --output=./sites/tving.com/tving.com.channels.xml
// npx epg-grabber --config=sites/tving.com/tving.com.config.js --channels=sites/tving.com/tving.com.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./tving.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-23', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'C00551',
  xmltv_id: 'tvN.kr'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    `https://api.tving.com/v2/media/schedules/C00551/20230123?callback=cb&pageNo=1&pageSize=500&screenCode=CSSD0200&networkCode=CSND0900&osCode=CSOD0900&teleCode=CSCD0900&apiKey=4263d7d76161f4a19a9efe9ca7903ec4`
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.txt'), 'utf8')
  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    title: '외계+인 1부',
    description: '외계+인 1부',
    icon: 'https://image.tving.com/upload/cms/caip/CAIP0200/P001661154.jpg',
    date: 2022,
    categories: [],
    directors: ['최동훈'],
    actors: ['김우빈', '류준열'],
    start: '2023-01-22T13:40:00.000Z',
    stop: '2023-01-22T15:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.txt'), 'utf8')

  expect(parser({ content })).toMatchObject([])
})
