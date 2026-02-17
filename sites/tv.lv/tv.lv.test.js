const { parser, url } = require('./tv.lv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-11-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'ltv1',
  xmltv_id: 'LTV1.lv'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.tv.lv/programme/listing/none/30-11-2023?filter=channel&subslug=ltv1'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(40)

  expect(results[0]).toMatchObject({
    start: '2023-11-29T22:05:00.000Z',
    stop: '2023-11-29T22:35:00.000Z',
    title: 'Ielas garumā.  Pārdaugavas koka arhitektūra',
    description: '',
    category: ''
  })

  expect(results[39]).toMatchObject({
    start: '2023-11-30T21:30:00.000Z',
    stop: '2023-11-30T22:30:00.000Z',
    title: 'Latvijas Sirdsdziesma',
    description: '',
    category: ''
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(results).toMatchObject([])
})
