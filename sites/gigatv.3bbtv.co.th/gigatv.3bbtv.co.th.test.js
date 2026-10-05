const { parser, url } = require('./gigatv.3bbtv.co.th.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-12', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '222',
  xmltv_id: 'ThainessTV.th'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe(
    'https://gigatv.3bbtv.co.th/wp-content/themes/changwattana/epg/222.json'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(32)
  expect(results[0]).toMatchObject({
    start: '2025-01-12T00:00:00.000Z',
    stop: '2025-01-12T00:30:00.000Z',
    title: 'THAILAND FORM ABOVE : TAK'
  })
  expect(results[31]).toMatchObject({
    start: '2025-01-12T23:30:00.000Z',
    stop: '2025-01-13T00:00:00.000Z',
    title: 'MAESA ELEPHANT CAMP'
  })
})

it('can handle empty guide', () => {
  expect(parser({ content: '', date })).toMatchObject([])
})
