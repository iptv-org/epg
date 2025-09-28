const { parser, url, request } = require('./teleboy.ch.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-26', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '303', xmltv_id: 'SRF1.ch' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://api.teleboy.ch/epg/broadcasts?begin=2025-01-26 00:00:00&end=2025-01-27 00:00:00&expand=flags,primary_image&station=303'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'x-teleboy-apikey': 'e899f715940a209148f834702fc7f340b6b0496b62120b3ed9c9b3ec4d7dca00'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(35)
  expect(results[0]).toMatchObject({
    title: 'Der Staatsanwalt',
    description:
      'Der Tod eines beliebten Wasserretters konfrontiert Oberstaatsanwalt Bernd Reuther, Hauptkommissarin Kerstin Klar und Oberkommissar Max Fischer mit einem undurchsichtigen Geflecht aus Lügen.',
    subtitle: 'Tod eines Helden',
    episode: 6,
    season: 16,
    date: '2021',
    image:
      'https://media.teleboy.ch/media/teleboyteaser6/bd01aed53c7a37399ae034c2a1a2cc8aa31943f2.jpg',
    starRatings: {
      system: 'IMDb',
      value: 6
    },
    start: '2025-01-25T22:45:00.000Z',
    stop: '2025-01-25T23:50:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })

  expect(results).toMatchObject([])
})
