const { parser, url } = require('./epgmaster.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-05-18', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'ntv' }

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://epgmaster.com/api/channels/ntv/epgs?token=1610283054')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(46)
  expect(results[0]).toMatchObject({
    title: 'Krishi Teleflim-Bharosa Yuwama',
    start: '2025-05-18T00:00:00.000Z',
    stop: '2025-05-18T00:15:00.000Z'
  })
  expect(results[1]).toMatchObject({
    title: 'News in Nepali [Rec.]',
    start: '2025-05-18T00:15:00.000Z',
    stop: '2025-05-18T00:45:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '', date })

  expect(results).toMatchObject([])
})
