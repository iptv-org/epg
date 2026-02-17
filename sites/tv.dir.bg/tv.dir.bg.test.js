const { parser, url } = require('./tv.dir.bg.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-06-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '61',
  xmltv_id: 'BTV.bg'
}

it('can generate valid url', () => {
  expect(url).toBe('https://tv.dir.bg/load/programs')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

 expect(results.length).toBe(63)

 expect(results[0]).toMatchObject({
  start: '2025-06-30T03:00:00.000Z',
  stop: '2025-06-30T03:30:00.000Z',
  title: 'Светът на здравето'
 })

 expect(results[62]).toMatchObject({
  start: '2025-07-01T02:00:00.000Z',
  stop: '2025-07-01T02:30:00.000Z',
  title: 'Убийства в Рая , сезон 1 , епизод 7'
 })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
