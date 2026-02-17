const { parser, url } = require('./dna.fi.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-15', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'ch-216356',
  xmltv_id: 'MTV3.fi'
}

it('can generate valid url', async () => {
  expect(url({ date, channel })).toBe(
    'https://mts-pro-envoy-vip.dna.fi/hbx/api/pub/xrtv/g/media?q=channel:ch-216356&q=profile:pr&q=start-interval:1736906400000/1736992799000'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  let results = parser({ date, content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(20)
  expect(results[0]).toMatchObject({
    start: '2025-01-15T02:30:00.000Z',
    stop: '2025-01-15T03:22:00.000Z',
    title: {
      lang: 'fi',
      value: 'Next Level Chef'
    },
    subtitle: {
      lang: 'fi',
      value: 'Brunssi'
    },
    season: 1,
    episode: 6,
    rating: {
      system: 'VET',
      value: 'S'
    },
    date: '2022',
    images: [
      'https://mts-pro-cache-vip.dna.fi/meme/v2/37f/3851073346622580374_aspect_ratio_16_9_1.jpg'
    ],
    description: {
      lang: 'fi',
      value:
        'Kausi 1, 6/11. Brunssi. Päivän haasteessa valmistetaan rentoa brunssiruokaa. Yksi kilpailija tekee valtaisan virheen myöhästyessään annosten luovutuksesta. Amerikkalainen tosi-tv-sarja.'
    },
    categories: ['Reality TV', 'Entertainment', 'TV Show', 'Next Level Chef', 'Series 1']
  })
  expect(results[5]).toMatchObject({
    title: {
      lang: 'fi',
      value: 'Kauniit ja rohkeat (S)'
    },
    subtitle: {
      lang: 'fi',
      value: 'Parantava syleily'
    },
    start: '2025-01-15T08:30:00.000Z',
    stop: '2025-01-15T09:00:00.000Z',
    season: 37,
    episode: 9380,
    rating: {
      system: 'VET',
      value: 'S'
    },
    date: '2023',
    images: [
      'https://mts-pro-cache-vip.dna.fi/meme/v2/79e/6509488401145439178_aspect_ratio_16_9_1.jpg'
    ],
    description: {
      lang: 'fi',
      value:
        'Steffy on vähällä yllättää Hopen ja Carterin kesken herkän hetken. Ridgen kannustamana Taylor suostuu kokeilemaan Shandran parannusmenetelmää, ja pitkään padotut tunteet saavat viimein vapautua.'
    },
    categories: [
      'Soap',
      'Drama',
      'Romance',
      'Series',
      'TV Show',
      'The Bold and the Beautiful',
      'Series 37'
    ],
    actors: [{ lang: 'en', value: 'Katherine Kelly Lang' }]
  })
  expect(results[19]).toMatchObject({
    start: '2025-01-15T16:30:00.000Z',
    stop: '2025-01-15T17:00:00.000Z',
    title: {
      lang: 'fi',
      value: 'Emmerdale (S)'
    },
    subtitle: {
      lang: 'fi',
      value: 'Epäilyksen varjossa'
    },
    season: 54,
    episode: 9845,
    rating: {
      system: 'VET',
      value: 'S'
    },
    date: '2023',
    images: [
      'https://mts-pro-cache-vip.dna.fi/meme/v2/5e8/5978592001161112833_aspect_ratio_16_9_1.jpg'
    ],
    description: {
      lang: 'fi',
      value:
        'Caleb haistaa palaneen käryä Craigin kuolemaan liittyen. Mackenzien yllätysvierailu antaa vahvistuksen Chloen päätökselle. Lydia pohtii, pitäisikö hänen mennä Craigin hautajaisiin. Dawnin supistukset säikäyttävät Rhonan.'
    },
    categories: ['Soap', 'Drama', 'Romance', 'Series', 'TV Show', 'Emmerdale', 'Series 54'],
    directors: [
      { lang: 'en', value: 'Ian Bevitt' },
      { lang: 'en', value: 'Munir Malik' }
    ]
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    content: ''
  })

  expect(results).toMatchObject([])
})
