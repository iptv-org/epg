const { parser, url } = require('./tvarenasport.hr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-07', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '01',
  xmltv_id: 'ArenaSport1.hr'
}

it('can generate valid url', () => {
  expect(url).toBe('https://tvarenaprogram.com/live/v2/hr')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.html'))
  const result = parser({ channel, date, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result.length).toBe(15)
  expect(result[0]).toMatchObject({
    start: '2024-12-07T00:00:00.000Z',
    stop: '2024-12-07T00:30:00.000Z',
    title: 'MAGAZIN',
    description: 'NBA ACTION',
    category: 'Košarka'
  })
  expect(result[4]).toMatchObject({
    start: '2024-12-07T06:00:00.000Z',
    stop: '2024-12-07T07:30:00.000Z',
    title: 'EHF LIGA PRVAKA',
    description: 'DINAMO BUKUREŠT - PSG',
    category: 'Rukomet'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: ''
  })
  expect(result).toMatchObject([])
})
