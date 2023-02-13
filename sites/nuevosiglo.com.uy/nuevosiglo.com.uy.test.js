// npm run channels:parse -- --config=./sites/nuevosiglo.com.uy/nuevosiglo.com.uy.config.js --output=./sites/nuevosiglo.com.uy/nuevosiglo.com.uy.channels.xml
// npx epg-grabber --config=sites/nuevosiglo.com.uy/nuevosiglo.com.uy.config.js --channels=sites/nuevosiglo.com.uy/nuevosiglo.com.uy.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./nuevosiglo.com.uy.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-02-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'HBO',
  xmltv_id: 'HBOLatinAmerica.us'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://www.nuevosiglo.com.uy/programacion/getGrilla?fecha=2023/02/10'
  )
})

it('can parse response', async () => {
  axios.get.mockImplementation(url => {
    if (url === 'https://www.nuevosiglo.com.uy/Programacion/getScheduleXId/133769227') {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program1.json')))
      })
    } else if (url === 'https://www.nuevosiglo.com.uy/Programacion/getScheduleXId/133769239') {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program2.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  let results = await parser({ content, channel })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-02-10T01:11:00.000Z',
    stop: '2023-02-10T03:46:00.000Z',
    title: `Jurassic World: Dominion`,
    description:
      'Años después de la destrucción de Isla Nublar, los dinosaurios viven y cazan junto a los humanos. Este equilibrio determinará, si los humanos seguirán siendo los depredadores máximos en un planeta que comparten con las criaturas temibles.',
    icon: 'https://img-ns.s3.amazonaws.com/grid_data/23354476.jpg',
    date: '2022',
    rating: {
      system: 'MPAA',
      value: 'PG-13'
    },
    actors: ['Jeff Goldblum', 'Sam Neill', 'Bryce Dallas Howard']
  })

  expect(results[1]).toMatchObject({
    start: '2023-02-11T02:06:00.000Z',
    stop: '2023-02-11T04:16:00.000Z',
    title: `Black Adam`,
    description:
      'Black Adam es liberado de su tumba casi cinco mil años después de haber sido encarcelado y recibir sus poderes de los antiguos dioses. Ahora está listo para desatar su forma única de justicia en el mundo.',
    icon: 'https://img-ns.s3.amazonaws.com/grid_data/24638423.jpg',
    date: '2022',
    rating: {
      system: 'MPAA',
      value: 'PG-13'
    },
    actors: [
      'Aldis Hodge',
      'Dwayne Johnson',
      'Noah Centineo',
      'Sarah Shahi',
      'Marwan Kenzari',
      'Pierce Brosnan',
      'Quintessa Swindell',
      'Mohammed Amer',
      'Bodhi Sabongui',
      'James Cusati-Moyer'
    ]
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    channel,
    content: ``
  })

  expect(results).toMatchObject([])
})
