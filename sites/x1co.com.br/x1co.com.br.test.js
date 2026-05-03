const { parser, url } = require('./x1co.com.br.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-05-04', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'nickonline.br' }

it('can generate valid url', () => {
  expect(url).toBe('https://x1co.com.br/epg/epg.xml')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.xml'))

  const results = parser({ content, channel, date })

  expect(results.length).toBe(46)
  expect(results[0]).toMatchObject({
    title: 'Bob Esponja',
    subTitle: 'T13 Ep1',
    description: 'Bob Esponja — T13 Ep1',
    category: 'Infantil',
    start: '2026-05-04T00:02:39.000Z',
    stop: '2026-05-04T00:14:06.000Z'
  })
  expect(results[45]).toMatchObject({
    title: 'Tainá e Os Guardiões da Amazônia',
    category: 'Infantil',
    start: '2026-05-04T11:28:01.000Z',
    stop: '2026-05-04T11:39:41.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
