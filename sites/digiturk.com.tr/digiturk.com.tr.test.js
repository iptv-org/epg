const { parser, url } = require('./digiturk.com.tr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-12', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '351',
  xmltv_id: 'Nickelodeon.tr'
}

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://www.digiturk.com.tr/Ajax/GetTvGuideFromDigiturk?Day=01%2F12%2F2025+00%3A00%3A00'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.html'))
  const results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(57)
  expect(results[0]).toMatchObject({
    start: '2025-01-11T21:00:00.000Z',
    stop: '2025-01-11T21:25:00.000Z',
    title: 'Sünger Bob Kare Pantolon'
  })
  expect(results[56]).toMatchObject({
    start: '2025-01-12T17:40:00.000Z',
    stop: '2025-01-12T18:00:00.000Z',
    title: 'Casagrande Ailesi'
  })
})

it('can handle empty guide', () => {
  const result = parser({ content: '', channel, date })
  expect(result).toMatchObject([])
})
