// npx epg-grabber --config=sites/berrymedia.co.kr/berrymedia.co.kr.config.js --channels=sites/berrymedia.co.kr/berrymedia.co.kr.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./berrymedia.co.kr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-26', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '',
  xmltv_id: 'GTV.kr'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('http://www.berrymedia.co.kr/schedule_proc.php')
})

it('can generate request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest'
  })
})

it('can generate valid request data', () => {
  let params = request.data({ date })

  expect(params.get('week')).toBe('2023-01-23~2023-01-29')
  expect(params.get('day')).toBe('2023-01-26')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-01-25T15:00:00.000Z',
    stop: '2023-01-25T16:00:00.000Z',
    title: `더트롯쇼`,
    category: '연예/오락',
    rating: {
      system: 'KMRB',
      value: '15'
    }
  })

  expect(results[17]).toMatchObject({
    start: '2023-01-26T13:50:00.000Z',
    stop: '2023-01-26T14:20:00.000Z',
    title: `나는 자연인이다`,
    category: '교양',
    rating: {
      system: 'KMRB',
      value: 'ALL'
    }
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })

  expect(results).toMatchObject([])
})
