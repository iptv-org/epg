const { parser, url } = require('./thesportplus.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'usa',
  xmltv_id: 'SportPlusUSA.us'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.thesportplus.com/schedule_usa.php?d=2025-01-19')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(13)
  expect(results[0]).toMatchObject({
    start: '2025-01-19T06:00:00.000Z',
    stop: '2025-01-19T08:00:00.000Z',
    title: 'ASTERAS vs ATROMITOS',
    description: 'Super League Season 24-25 MD 4'
  })
  expect(results[12]).toMatchObject({
    start: '2025-01-20T04:00:00.000Z',
    stop: '2025-01-20T05:00:00.000Z',
    title: 'SPORTSHOW',
    description: 'Super League'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  })
  expect(results).toMatchObject([])
})
