const { parser, url } = require('./dtv8.net.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-02-21', 'YYYY-MM-DD').startOf('d')

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://dtv8.net/tv-listings/friday/')
})

it('can parse response for friday', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_fri.html'))

  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(18)
  expect(results[9]).toMatchObject({
    title: 'Smallville',
    image: 'http://dtv8.net/wp-content/uploads/71P0aShCBXL._SL1300_.jpg',
    description:
      'A young Clark Kent struggles to find his place in the world as he learns to harness his alien powers for good and deals with the typical troubles of teenage life in Smallville, Kansas.',
    start: '2025-02-21T21:00:00.000Z',
    stop: '2025-02-21T22:00:00.000Z'
  })
  expect(results[15]).toMatchObject({
    title: 'Law & Order',
    image: null,
    description:
      'In God We Trust: A young lawyer with a secret past is found dead; Price and Baxter debate the pros and cons of prison as a punishment versus alternative justice options.',
    start: '2025-02-22T01:45:00.000Z',
    stop: '2025-02-22T02:30:00.000Z'
  })
})

it('can parse response for saturday', () => {
  const date = dayjs.utc('2025-02-22', 'YYYY-MM-DD').startOf('d')
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_sat.html'))

  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(11)
  expect(results[0]).toMatchObject({
    title: 'Sign On',
    image: null,
    description: null,
    start: '2025-02-22T13:55:00.000Z',
    stop: '2025-02-22T14:00:00.000Z'
  })
  expect(results[10]).toMatchObject({
    title: 'Sign Off',
    image: null,
    description: null,
    start: '2025-02-23T04:00:00.000Z',
    stop: '2025-02-23T04:30:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
