const { parser, url } = require('./tivu.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs('2026-02-26', 'YYYY-MM-DD')

const channel = {
  site_id: '42',
  xmltv_id: 'Rai1HD.it'
}

it('can generate valid url for today', () => {
  expect(url({ channel, date })).toBe('https://services.tivulaguida.it/api/epg/channels/42/date/2026-02-26')
})

it('can parse response', async () => {
  const date = dayjs.utc('2026-02-25', 'YYYY-MM-DD').startOf('d')
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  let results = await parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2026-02-25T05:00:00.000Z',
    stop: '2026-02-25T05:28:00.000Z',
    title: '1mattina News'
  })

  expect(results[28]).toMatchObject({
    start: '2026-02-25T22:56:00.000Z',
    stop: '2026-02-26T00:15:00.000Z',
    title: 'Festival di Sanremo'
  })
})

it('can handle empty guide', async () => {
  const date = dayjs.utc('2026-02-25', 'YYYY-MM-DD').startOf('d')
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const result = await parser({ content, channel, date })
  expect(result).toMatchObject([])
})
