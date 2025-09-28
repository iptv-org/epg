const { parser, url } = require('./tvarenasport.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-07-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'a1p',
  xmltv_id: 'ArenaSport1Premium.rs'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.tvarenasport.com/tv-scheme')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.html'))
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result.length).toBe(13)
  expect(result[4]).toMatchObject({
    start: '2025-07-30T08:00:00.000Z',
    stop: '2025-07-30T09:00:00.000Z',
    title: 'UEFA LIGA ŠAMPIONA: Liga Šampiona: Pregled sezone',
    category: 'Fudbal'
  })
  expect(result[6]).toMatchObject({
    start: '2025-07-30T11:00:00.000Z',
    stop: '2025-07-30T13:00:00.000Z',
    title: '(Uživo) PRIJATELJSKE UTAKMICE: K League - Newcastle Utd'
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
