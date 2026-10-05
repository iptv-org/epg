const config = require('./pluto.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-28', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '5ee92e72fb286e0007285fec',
  xmltv_id: 'Naruto'
}

it('can generate valid url', () => {
  const url = config.url({ date, channel })
  expect(url).toBe(
    'https://api.pluto.tv/v2/channels/5ee92e72fb286e0007285fec?start=2024-12-27T12:00:00.000Z&stop=2024-12-31T11:59:59.999Z'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const results = config.parser({ content }).map(p => {
    p.start = dayjs(p.start).toJSON()
    p.stop = dayjs(p.stop).toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2024-12-28T00:21:00.000Z',
    stop: '2024-12-28T00:48:00.000Z',
    title: 'Naruto: El Tercer Hokage, Eternamente',
    description:
      'Gaara y Naruto continúan combatiendo con todas sus fuerzas. Decidido a proteger a Sakura, Naruto ataca a Gaara una y otra vez.',
    subTitle: 'El Tercer Hokage, Eternamente',
    episode: 80,
    season: 2,
    actors: [
      'Isabel Martion (Naruto Uzumaki)',
      'Christine Byrd (Sakura Haruno)',
      'Victor Ugarte (Sasuke Uchiha)',
      'Alfonso Obreg (Kakashi Hatake)'
    ],
    categories: ['Anime', 'Anime Action & Adventure'],
    rating: 'TV-14',
    date: '2004-04-21T00:00:00.000Z',
    icon: 'https://images.pluto.tv/series/5e73b850e40c9f001a0a9fb4/tile.jpg?fill=blur&fit=fill&fm=jpg&h=660&q=75&w=660'
  })
})

it('can handle empty guide', () => {
  const results = config.parser({
    content: '[]'
  })
  expect(results).toMatchObject([])
})
