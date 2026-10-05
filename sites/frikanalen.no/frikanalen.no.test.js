const { parser, url } = require('./frikanalen.no.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-01-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'Frikanalen.no'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://frikanalen.no/api/scheduleitems/?date=2022-01-19&format=json&limit=100'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-01-18T23:47:00.000Z',
      stop: '2022-01-19T00:44:55.640Z',
      title: 'FSCONS 2017 - Keynote: TBA - Linda Sandvik',
      category: ['Samfunn'],
      description: "Linda Sandvik's keynote at FSCONS 2017\r\n\r\nRecorded by NUUG for FSCONS."
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
