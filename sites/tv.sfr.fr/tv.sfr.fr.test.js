const { parser, url } = require('./tv.sfr.fr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-18', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '192',
  xmltv_id: 'TF1.fr'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://static-cdn.tv.sfr.net/data/epg/gen8/guide_web_20250118.json'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  let results = parser({ content, channel })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(23)
  expect(results[0]).toMatchObject({
    start: '2025-01-18T02:05:00.000Z',
    stop: '2025-01-18T05:00:00.000Z',
    title: 'Programmes de la nuit',
    subtitle: null,
    category: 'Programme indéterminé',
    description: 'Retrouvez tous vos programmes de nuit.',
    images: [
      'http://static-cdn.tv.sfr.net/data/img/pl/3/6/9/5757963.jpg',
      'http://static-cdn.tv.sfr.net/data/img/pl/5/0/8/7616805.jpg'
    ],
    season: null,
    episode: null
  })
  expect(results[22]).toMatchObject({
    start: '2025-01-18T22:40:00.000Z',
    stop: '2025-01-19T00:00:00.000Z',
    title: 'Star Academy',
    subtitle: 'Retour au château',
    category: 'Téléréalité',
    description:
      "C'est en direct du plateau que Nikos Aliagas revient sur les prestations des différents académiciens en compagnie du corps professoral. L'occasion de revenir en détails sur le déroulement du prime avec les aspects positifs mais également les éléments sur lesquels les élèves doivent progresser pour espérer faire la différence sur cette fin d'aventure.",
    images: [
      'http://static-cdn.tv.sfr.net/data/img/pl/1/0/0/9517001.jpg',
      'http://static-cdn.tv.sfr.net/data/img/pl/6/7/2/9992276.jpg',
      'http://static-cdn.tv.sfr.net/data/img/pl/9/0/1/9985109.jpg',
      'http://static-cdn.tv.sfr.net/data/img/pl/6/7/5/9491576.jpg'
    ],
    season: 12,
    episode: 15
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: ''
  })

  expect(results).toMatchObject([])
})
