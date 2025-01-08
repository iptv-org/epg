const { parser, url } = require('./tvarenasport.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-07', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'a1p',
  xmltv_id: 'ArenaSport1Premium.rs'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.tvarenasport.com/tv-scheme')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.html'))
  const result = parser({ channel, date, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result.length).toBe(19)
  expect(result[4]).toMatchObject({
    start: '2024-12-07T03:30:00.000Z',
    stop: '2024-12-07T05:00:00.000Z',
    title: 'EVROPSKO PRVENSTVO Ž',
    description: 'Francuska - Crna Gora',
    category: 'Rukomet'
  })
  expect(result[8]).toMatchObject({
    start: '2024-12-07T11:00:00.000Z',
    stop: '2024-12-07T11:05:00.000Z',
    title: 'Arena News'
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
