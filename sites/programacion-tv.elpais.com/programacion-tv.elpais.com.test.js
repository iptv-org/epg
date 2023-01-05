// npx epg-grabber --config=sites/programacion-tv.elpais.com/programacion-tv.elpais.com.config.js --channels=sites/programacion-tv.elpais.com/programacion-tv.elpais.com.channels.xml --output=guide.xml --days=2
// npm run channels:parse -- --config=./sites/programacion-tv.elpais.com/programacion-tv.elpais.com.config.js --output=./sites/programacion-tv.elpais.com/programacion-tv.elpais.com.channels.xml

const { parser, url } = require('./programacion-tv.elpais.com.config.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-10-04', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '3',
  xmltv_id: 'La1.es'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://programacion-tv.elpais.com/data/parrilla_04102022.json')
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  axios.get.mockImplementation(url => {
    if (url === 'https://programacion-tv.elpais.com/data/programas/3.json') {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/programs.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  let results = await parser({ content, channel })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results).toMatchObject([
    {
      start: '2022-10-03T23:30:00.000Z',
      stop: '2022-10-04T00:25:00.000Z',
      title: 'Comerse el mundo',
      sub_title: 'París',
      description:
        'El chef Peña viaja hasta París, una de las capitales mundiales de la alta gastronomía. Allí visitará un viñedo muy especial en pleno corazón de la ciudad, probará los famosos caracoles, hará un queso y conocerá a chefs que llegaron a la capital gala para cumplir sus sueños y los consiguieron.',
      director: ['Sergio Martín', 'Victor Arribas'],
      presenter: ['Javier Peña'],
      writer: ['Filippo Gravino', 'Guido Iuculano', 'Michele Pellegrini'],
      actors: ['Pietro Sermonti', 'Maya Sansa', 'Ana Caterina Morariu'],
      guest: ['Tobia de Angelis', 'Benedetta Porcaroli', 'Roberto Nocchi'],
      producer: ['Javier Redondo'],
      composer: ['Paco Musulén'],
      category: 'Ocio-Cultura/Cocina',
      season: 1,
      episode: 23,
      icon: 'https://programacion-tv.elpais.com/imagenes/programas/2099957.jpg'
    }
  ])
})

it('can handle empty guide', async () => {
  const result = await parser({
    content: ``,
    channel
  })
  expect(result).toMatchObject([])
})
