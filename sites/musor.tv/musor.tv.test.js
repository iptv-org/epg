const { parser, url } = require('./musor.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-10-11', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'MAGYAR_MOZI_TV',
  xmltv_id: 'MagyarMoziTV.hu',
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://musor.tv/napi/tvmusor/MAGYAR_MOZI_TV/2025.10.11')
})

it('can generate valid url for today', () => {
  const today = dayjs.utc().startOf('d')

  expect(url({ channel, date: today })).toBe('https://musor.tv/mai/tvmusor/MAGYAR_MOZI_TV')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2025-10-10T23:05:00.000Z',
    stop: '2025-10-11T00:50:00.000Z',
    title: 'A 25. év - Három rohadék rockcsempész (Tankcsapda road movie)',
    description: 'Lévai Balázs több mint egy éven át forgatott a Tankcsapdával.'
  })

  expect(results[1]).toMatchObject({
    start: '2025-10-11T00:50:00.000Z',
    stop: '2025-10-11T01:45:00.000Z',
    title: 'Megbélyegzetten - 1968',
    description: 'Néhány tinédzser diák, egy csalinak szánt újságcikk nyomán levelet írt Ausztriába 1968-ban.'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    content: '<!DOCTYPE html><html><head></head><body></body></html>'
  })
  expect(result).toMatchObject([])
})
