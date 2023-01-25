// npx epg-grabber --config=sites/ena.skylifetv.co.kr/ena.skylifetv.co.kr.config.js --channels=sites/ena.skylifetv.co.kr/ena.skylifetv.co.kr.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./ena.skylifetv.co.kr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-27', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'ENA',
  xmltv_id: 'ENA.kr'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('http://ena.skylifetv.co.kr/ENA/?day=20230127&sc_dvsn=U')
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
    start: '2023-01-26T16:05:00.000Z',
    stop: '2023-01-26T17:20:00.000Z',
    title: `법쩐 6화`,
    rating: {
      system: 'KMRB',
      value: '15'
    }
  })

  expect(results[17]).toMatchObject({
    start: '2023-01-27T14:10:00.000Z',
    stop: '2023-01-27T15:25:00.000Z',
    title: `남이 될 수 있을까 4화`,
    rating: {
      system: 'KMRB',
      value: '15'
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
