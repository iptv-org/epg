const { parser, url } = require('./movistarplus.es.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-23', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'sexta',
  xmltv_id: 'LaSexta.es'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.movistarplus.es/programacion-tv/sexta/2025-01-23'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(20)
  expect(results[0]).toMatchObject({
    start: '2025-01-23T05:00:00.000Z',
    stop: '2025-01-23T05:45:00.000Z',
    title: 'Venta Prime'
  })
  expect(results[19]).toMatchObject({
    start: '2025-01-24T03:31:00.000Z',
    stop: '2025-01-24T05:00:00.000Z',
    title: 'Minutos musicales'
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
