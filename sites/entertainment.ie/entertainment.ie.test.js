// npm run channels:parse -- --config=./sites/entertainment.ie/entertainment.ie.config.js --output=./sites/entertainment.ie/entertainment.ie.channels.xml
// npx epg-grabber --config=sites/entertainment.ie/entertainment.ie.config.js --channels=sites/entertainment.ie/entertainment.ie.channels.xml --output=guide.xml

const fs = require('fs')
const path = require('path')
const { parser, url } = require('./entertainment.ie.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-06-29', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'rte2', xmltv_id: 'RTE2.ie' }

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://entertainment.ie/tv/rte2/?date=29-06-2023&time=all-day'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ date, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(51)

  expect(results[0]).toMatchObject({
    start: '2023-06-29T06:00:00.000Z',
    stop: '2023-06-29T08:00:00.000Z',
    title: 'EuroNews',
    description: 'European and international headlines live via satellite',
    icon: 'https://img.resized.co/entertainment/eyJkYXRhIjoie1widXJsXCI6XCJodHRwczpcXFwvXFxcL3R2LmFzc2V0cy5wcmVzc2Fzc29jaWF0aW9uLmlvXFxcLzcxZDdkYWY2LWQxMjItNTliYy1iMGRjLTFkMjc2ODg1MzhkNC5qcGdcIixcIndpZHRoXCI6NDgwLFwiaGVpZ2h0XCI6Mjg4LFwiZGVmYXVsdFwiOlwiaHR0cHM6XFxcL1xcXC9lbnRlcnRhaW5tZW50LmllXFxcL2ltYWdlc1xcXC9uby1pbWFnZS5wbmdcIn0iLCJoYXNoIjoiZDhjYzA0NzFhMGZhOTI1Yjc5ODI0M2E3OWZjMGI2ZGJmMDIxMjllNyJ9/71d7daf6-d122-59bc-b0dc-1d27688538d4.jpg',
    categories: ['Factual']
  })

  expect(results[50]).toMatchObject({
    start: '2023-06-30T02:25:00.000Z',
    stop: '2023-06-30T06:00:00.000Z',
    title: 'EuroNews',
    description: 'European and international headlines live via satellite',
    icon: 'https://img.resized.co/entertainment/eyJkYXRhIjoie1widXJsXCI6XCJodHRwczpcXFwvXFxcL3R2LmFzc2V0cy5wcmVzc2Fzc29jaWF0aW9uLmlvXFxcLzcxZDdkYWY2LWQxMjItNTliYy1iMGRjLTFkMjc2ODg1MzhkNC5qcGdcIixcIndpZHRoXCI6NDgwLFwiaGVpZ2h0XCI6Mjg4LFwiZGVmYXVsdFwiOlwiaHR0cHM6XFxcL1xcXC9lbnRlcnRhaW5tZW50LmllXFxcL2ltYWdlc1xcXC9uby1pbWFnZS5wbmdcIn0iLCJoYXNoIjoiZDhjYzA0NzFhMGZhOTI1Yjc5ODI0M2E3OWZjMGI2ZGJmMDIxMjllNyJ9/71d7daf6-d122-59bc-b0dc-1d27688538d4.jpg',
    categories: ['Factual']
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no-content.html'))
  const result = parser({
    date,
    channel,
    content
  })
  expect(result).toMatchObject([])
})
