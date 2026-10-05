const { parser, url } = require('./passie.nl.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-08-26', 'YYYY-MM-DD').startOf('d')

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://passie.nl/tvgids.php?day=2025-08-26')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(45)
  expect(results[0]).toMatchObject({
    title: 'Young Anal Charm - Scene 1',
    start: '2025-08-25T21:43:00.000Z',
    stop: '2025-08-25T22:00:00.000Z'
  })
  expect(results[44]).toMatchObject({
    title: 'Stud Doctor Slams Slutty Nurse',
    start: '2025-08-26T21:45:00.000Z',
    stop: '2025-08-26T22:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const results = parser({ content, date })

  expect(results).toMatchObject([])
})
