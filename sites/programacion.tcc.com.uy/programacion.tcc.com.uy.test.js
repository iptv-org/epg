// npm run channels:parse -- --config=./sites/programacion.tcc.com.uy/programacion.tcc.com.uy.config.js --output=./sites/programacion.tcc.com.uy/programacion.tcc.com.uy.channels.xml
// npx epg-grabber --config=sites/programacion.tcc.com.uy/programacion.tcc.com.uy.config.js --channels=sites/programacion.tcc.com.uy/programacion.tcc.com.uy.channels.xml --output=guide.xml --timeout=30000 --days=2

const { parser, url } = require('./programacion.tcc.com.uy.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-02-11', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '212',
  xmltv_id: 'MultiPremier.mx'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    `https://www.tccvivo.com.uy/api/v1/navigation_filter/1575/filter/?cable_operator=1&emission_start=2023-02-11T00:00:00Z&emission_end=2023-02-12T00:00:00Z&format=json`
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, channel })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-02-10T22:45:00.000Z',
    stop: '2023-02-11T00:30:00.000Z',
    title: 'Meurtres à... - Temp. 3 - Episodio 3',
    date: 2016,
    season: 3,
    episode: 3,
    categories: [],
    icon: 'https://zpapi.zetatv.com.uy/media/images/2b45d2675389f2e4f7f6fe0655ccc968.jpg',
    description:
      'Cada episodio relata un lugar y una historia diferente pero siguiendo la línea de una investigación basada en una leyenda la cual es guiada por una pareja. Estos dos personajes no son necesariamente ambos policías, pero se ven obligados a colaborar a pesar de los primeros informes difíciles.'
  })
  expect(results[1]).toMatchObject({
    start: '2023-02-11T00:30:00.000Z',
    stop: '2023-02-11T03:00:00.000Z',
    title: 'Grandes esperanzas',
    date: 1998,
    season: null,
    episode: null,
    categories: ['Drama'],
    icon: 'https://zpapi.zetatv.com.uy/media/images/8cab42d88691edaa8a4001b91f809d91.jpg',
    description:
      'Basada en la novela de Charles Dickens, cuenta la historia del pintor Finn que persigue obsesionado a su amor de la niñez, la bella y rica Estella. Gracias a un misterioso benefactor, Finn es enviado a Nueva York, donde se reúne con la hermosa y fría joven.'
  })
  expect(results[3]).toMatchObject({
    start: '2023-02-11T05:35:00.000Z',
    stop: '2023-02-11T07:45:00.000Z',
    title: 'Los niños están bien',
    date: 2010,
    season: null,
    episode: null,
    categories: ['Comedia', 'Drama'],
    icon: 'https://zpapi.zetatv.com.uy/media/images/51684d91ed33cb9b0c1863b7a9b097e9.jpg',
    description:
      'Una pareja de lesbianas conciben a un niño y una niña por inseminacion artificial. Al paso del tiempo, los chicos deciden conocer a su verdadero padre a espaldas de sus madres. Tras localizarlo intentan integrar toda una familia. Podran lograrlo?.'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json')),
    channel
  })

  expect(results).toMatchObject([])
})
