const { parser, url } = require('./guidetnt.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')
require('dayjs/locale/fr')
dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

const date = dayjs.utc('2025-07-01', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'tf1',
  xmltv_id: 'TF1.fr'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.guidetnt.com/tv/programme-tf1')
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  let results = await parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(29)
  expect(results[0]).toMatchObject({
    category: 'Série',
    description:
      "Grande effervescence pour toute l'équipe du Camping Paradis, qui prépare les Olympiades. Côté arrivants, Hélène et sa fille Eva viennent passer quelques jours dans le but d'optimiser les révisions d'E...",
    start: '2025-06-30T22:55:00.000Z',
    stop: '2025-06-30T23:45:00.000Z',
    title: 'Camping Paradis'
  })
  expect(results[2]).toMatchObject({
    category: 'Magazine',
    description: 'Retrouvez tous vos programmes de nuit.',
    start: '2025-07-01T00:55:00.000Z',
    stop: '2025-07-01T04:00:00.000Z',
    title: 'Programmes de la nuit'
  })
  expect(results[15]).toMatchObject({
    category: 'Téléfilm',
    description:
      "La vie quasi parfaite de Riley bascule brutalement lorsqu'un accident de voiture lui coûte la vie, laissant derrière elle sa famille. Alors que l'enquête débute, l'affaire prend une tournure étrange l...",
    start: '2025-07-01T12:25:00.000Z',
    stop: '2025-07-01T14:00:00.000Z',
    title: "Trahie par l'amour"
  })
})

it('can parse response for current day', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  let results = await parser({ content, date: dayjs.utc('2025-07-01', 'YYYY-MM-DD').startOf('d') })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(29)
  expect(results[0]).toMatchObject({
    category: 'Série',
    description:
      "Grande effervescence pour toute l'équipe du Camping Paradis, qui prépare les Olympiades. Côté arrivants, Hélène et sa fille Eva viennent passer quelques jours dans le but d'optimiser les révisions d'E...",
    start: '2025-06-30T22:55:00.000Z',
    stop: '2025-06-30T23:45:00.000Z',
    title: 'Camping Paradis'
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    date,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  })

  expect(results).toEqual([])
})
