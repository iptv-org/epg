const { parser, url } = require('./guida.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '826573/rai-1',
  xmltv_id: 'Rai1.it'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.guida.tv/programmi-tv/palinsesto/canale/826573/rai-1.html?dt=2023-11-24'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-11-24T00:10:00.000Z',
    stop: '2023-11-24T01:05:00.000Z',
    title: 'Viva Rai2!'
  })

  expect(results[30]).toMatchObject({
    start: '2023-11-24T23:00:00.000Z',
    stop: '2023-11-24T23:30:00.000Z',
    title: 'TV 7'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: '<!DOCTYPE html><html><head></head><body></body></html>'
  })
  expect(result).toMatchObject([])
})
