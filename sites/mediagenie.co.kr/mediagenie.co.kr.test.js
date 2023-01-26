// npx epg-grabber --config=sites/mediagenie.co.kr/mediagenie.co.kr.config.js --channels=sites/mediagenie.co.kr/mediagenie.co.kr.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./mediagenie.co.kr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'ENA_DRAMA',
  xmltv_id: 'ENADRAMA.kr'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://mediagenie.co.kr/ENA_DRAMA/?qd=20230125')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    cookie: 'CUPID=d5ed6b77012aef2b4d4365ffd3a1a3a4'
  })
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
    start: '2023-01-24T15:20:00.000Z',
    stop: '2023-01-24T16:34:00.000Z',
    title: `대행사`,
    rating: {
      system: 'KMRB',
      value: '15'
    }
  })

  expect(results[16]).toMatchObject({
    start: '2023-01-25T14:27:00.000Z',
    stop: '2023-01-25T14:57:00.000Z',
    title: `법쩐`,
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
