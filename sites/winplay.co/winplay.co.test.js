const { parser, url, request } = require('./winplay.co.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-02-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'winsportsplus',
  xmltv_id: 'WinPlusFutbol.co'
}

it('can generate valid url', () => {
  expect(typeof url).toBe('function')
})

it('can generate valid request headers', () => {
  expect(typeof request.headers).toBe('function')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')

  const results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2026-02-19T00:20:00.000Z',
    stop: '2026-02-19T02:45:00.000Z',
    title: 'Liga BetPlay Dimayor 2026 - I: Junior vs. América (Fecha 7)'
  })

  expect(results[1]).toMatchObject({
    start: '2026-02-19T02:45:00.000Z',
    stop: '2026-02-19T03:30:00.000Z',
    title: 'Win Noticias',
  })

  expect(results[9]).toMatchObject({
    start: '2026-02-19T23:00:00.000Z',
    stop: '2026-02-20T00:30:00.000Z',
    title: 'Win Noticias'
  })
})

it('can handle empty guide', () => {
  const content = '{"count":0,"result":[]}'
  const results = parser({ content, channel, date })

  expect(results).toMatchObject([])
})
