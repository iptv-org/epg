const { parser } = require('./moji.id.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2023-08-18', 'YYYY-MM-DD').startOf('d')

it('can handle empty guide', () => {
  const results = parser({ content: '' })
  expect(results).toMatchObject([])
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  const results = parser({ content, date }).map(p => {
    p.start = p.start.year(2023).toJSON()
    p.stop = p.stop.year(2023).toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    title: 'TRUST',
    start: '2023-08-17T17:00:00.000Z',
    stop: '2023-08-17T17:30:00.000Z',
    description: 'Informasi seputar menjaga vitalitas pria'
  })
})
