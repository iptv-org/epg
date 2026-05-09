const { parser, url } = require('./epg.tmacaraibes.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-05-22', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'TMA.gp@SD' }

it('can generate valid url', () => {
  expect(url).toBe('https://epg.tmacaraibes.com/Epg/xmltv.xml')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.xml'))

  const results = parser({ content, channel, date })

  expect(results.length).toBe(18)
  expect(results[0]).toMatchObject({
    title: [
      { lang: 'fr', value: 'PLAY LIST' },
      { lang: 'en', value: 'PLAY LIST' },
      { lang: 'es', value: 'PLAY LIST' },
      { lang: 'pt', value: 'PLAY LIST' }
    ],
    description: [
      { lang: 'fr', value: 'Sélection des meilleurs clips africains et caribéens.' },
      { lang: 'en', value: 'Selection of the best African and Caribbean music videos.' },
      { lang: 'es', value: 'Selección de los mejores videoclips africanos y caribeños.' },
      { lang: 'pt', value: 'Seleção dos melhores videoclipes africanos e caribenhos.' }
    ],
    category: [{ value: 'music' }],
    length: [{ units: 'minutes', value: '180' }],
    icon: [{ src: 'http://www.tmacaraibes.com/images/playlist/playlist-003.jpg' }],
    ratings: [
      { system: 'CSA', value: 'Tout public' },
      { system: 'VCHIP', value: 'TV-G' }
    ],
    start: '2026-05-22T04:00:00.000Z',
    stop: '2026-05-22T07:00:00.000Z'
  })
  expect(results[17]).toMatchObject({
    title: [
      { lang: 'fr', value: 'GLOBAL' },
      { lang: 'en', value: 'GLOBAL' },
      { lang: 'es', value: 'GLOBAL' },
      { lang: 'pt', value: 'GLOBAL' }
    ],
    description: [
      { lang: 'fr', value: 'Toutes les musiques africaines et caribéennes.' },
      { lang: 'en', value: 'All African and Caribbean music.' },
      { lang: 'es', value: 'Toda la música africana y caribeña.' },
      { lang: 'pt', value: 'Todas as músicas africanas e caribenhas.' }
    ],
    category: [{ value: 'music' }],
    length: [{ units: 'minutes', value: '291' }],
    icon: [{ src: 'http://www.tmacaraibes.com/images/global/global-001.jpg' }],
    ratings: [
      { system: 'CSA', value: 'Tout public' },
      { system: 'VCHIP', value: 'TV-G' }
    ],
    start: '2026-05-22T23:09:00.000Z',
    stop: '2026-05-23T04:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
