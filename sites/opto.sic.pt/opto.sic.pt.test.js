const { parser, url } = require('./opto.sic.pt.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '38719848-2a57-42e3-8640-63a9aa39f107',
  xmltv_id: 'SICNoticias.pt'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://opto.sic.pt/api/v1/content/epg?startDate=1737072000&endDate=1737158400&channels=38719848-2a57-42e3-8640-63a9aa39f107'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(17)
  expect(results[0]).toMatchObject({
    start: '2025-01-17T00:00:00.000Z',
    stop: '2025-01-17T01:45:00.000Z',
    title: 'JORNAL DA MEIA-NOITE',
    episode: 16,
    season: null
  })
  expect(results[16]).toMatchObject({
    start: '2025-01-17T23:00:00.000Z',
    stop: '2025-01-18T00:00:00.000Z',
    title: 'EXPRESSO DA MEIA-NOITE',
    episode: 2,
    season: null
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
