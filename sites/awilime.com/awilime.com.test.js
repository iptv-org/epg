const { parser, url } = require('./awilime.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-06-26', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'budapest_europa_tv',
  xmltv_id: 'BudapestEuropaTelevizio.hu'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.awilime.com/tv/napi_musor/budapest_europa_tv/2024_06_26'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(15)

  expect(results[3]).toMatchObject({
    start: '2024-06-26T07:00:00.000Z',
    stop: '2024-06-26T08:00:00.000Z',
    title: 'Ébredés',
    sub_title: 'Amerikai dokumentumfilm (2018)',
    description: 'Balla Tibor misszionárius'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content:
      '<html><head><title>Object moved</title></head><body><h2>Object moved to <a href="/tv/napi_musor/budapest_europa_tv/2024_06_24">here</a>.</h2></body></html>'
  })
  expect(result).toMatchObject([])
})
