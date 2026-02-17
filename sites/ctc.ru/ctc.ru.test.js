const { parser, url } = require('./ctc.ru.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-06-22')

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://ctc.ru/api/page/v2/programm/?date=22-06-2025')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2025-06-22T03:00:00.000Z',
    stop: '2025-06-22T03:55:00.000Z',
    title: 'Три кота',
    category: 'Мультфильмы',
    new: false,
    url: 'https://ctc.ru/collections/multiki/',
    icons: [
      {
        src: 'https://mgf-static-ssl.ctc.ru/images/ctc-entity-dictionary-category/5/iconurl/web/5f9027fcba9ac-125x125.png',
        width: 125,
        height: 125,
      },
      {
        src: 'https://mgf-static-ssl.ctc.ru/images/ctc-entity-dictionary-category/5/iconurl/web/5f9027fc99587-60x60.png',
        width: 60,
        height: 60,
      },
    ],
    images: [
      {
        type: 'backdrop',
        size: '3',
        orient: 'L',
        value: 'https://mgf-static-ssl.ctc.ru/images/ctc-entity-project/1129/horizontalcover/web/66c319f0a31b5-1740x978.jpeg',
      },
      {
        type: 'backdrop',
        size: '2',
        orient: 'L',
        value: 'https://mgf-static-ssl.ctc.ru/images/ctc-entity-project/1129/horizontalcover/web/66c319f20bac2-400x225.jpeg',
      },
      {
        type: 'backdrop',
        size: '1',
        orient: 'L',
        value: 'https://mgf-static-ssl.ctc.ru/images/ctc-entity-project/1129/horizontalcover/web/66c319f244f92-150x84.jpeg',
      },
    ],
    rating: {
      system: 'Russia',
      value: '0+',
    },
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: JSON.stringify({
      isActive: true,
      url: '/programm/',
      header: [],
      sidebar: [],
      footer: [],
      content: [],
      seoTags: {},
      ogMarkup: {},
      userGeo: null,
      userData: null,
      meta: {},
      activeFrom: null,
      activeTo: null,
      type: 'tv-program-page',
    })
  })
  expect(results).toMatchObject([])
})
