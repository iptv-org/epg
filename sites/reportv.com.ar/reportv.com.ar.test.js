// npx epg-grabber --config=sites/reportv.com.ar/reportv.com.ar.config.js --channels=sites/reportv.com.ar/reportv.com.ar.channels.xml --output=guide.xml --days=2
// npm run channels:parse -- --config=./sites/reportv.com.ar/reportv.com.ar.config.js --output=./sites/reportv.com.ar/reportv.com.ar.channels.xml

const { parser, url, request } = require('./reportv.com.ar.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)
const axios = require('axios')
jest.mock('axios')

const date = dayjs.utc('2022-10-03', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '914',
  xmltv_id: 'VePlusVenezuela.ve'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.reportv.com.ar/buscador/ProgXSenial.php')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ channel, date })
  expect(result.get('idSenial')).toBe('914')
  expect(result.get('Alineacion')).toBe('2694')
  expect(result.get('DiaDesde')).toBe('2022/10/03')
  expect(result.get('HoraDesde')).toBe('00:00:00')
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  axios.post.mockImplementation((url, data) => {
    if (
      url === 'https://www.reportv.com.ar/buscador/DetallePrograma.php' &&
      data.get('id') == '286096'
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/program1.html'))
      })
    } else if (
      url === 'https://www.reportv.com.ar/buscador/DetallePrograma.php' &&
      data.get('id') == '392803'
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/program2.html'))
      })
    } else {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/no_program.html'))
      })
    }
  })

  let results = await parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-10-03T04:00:00.000Z',
    stop: '2022-10-03T05:00:00.000Z',
    title: '¿Quién tiene la razón?',
    category: 'Talk Show',
    icon: 'https://www.reportv.com.ar/buscador/img/Programas/4401882.jpg',
    actors: ['Nancy Álvarez'],
    description:
      'Espacio que dará de qué hablar cuando la doctora Nancy Álvarez y Carmen Jara, acompañadas de un jurado implacable, lleguen a escuchar y a resolver los problemas de las partes en conflicto para luego decidir quién tiene la razón.'
  })

  expect(results[21]).toMatchObject({
    start: '2022-10-04T03:00:00.000Z',
    stop: '2022-10-04T04:00:00.000Z',
    title: 'Valeria',
    category: 'Comedia',
    icon: 'https://www.reportv.com.ar/buscador/img/Programas/18788047.jpg',
    directors: ['Inma Torrente'],
    actors: [
      'Diana Gómez',
      'Silma López',
      'Paula Malia',
      'Teresa Riott',
      'Maxi Iglesias',
      'Juanlu González',
      'Aitor Luna',
      'Lauren McFall',
      'Éva Martin',
      'Raquel Ventosa'
    ],
    description:
      'Valeria es una escritora que no está pasando por su mejor momento a nivel profesional y sentimental. La distancia emocional que la separa de su marido la lleva a refugiarse en sus tres mejores amigas: Carmen, Lola y Nerea. Valeria y sus amigas están inmersas en un torbellino de emociones de amor, amistad, celos, infidelidad, dudas, desamor, secretos, trabajo, preocupaciones, alegrías y sueños sobre el futuro.'
  })
})

it('can handle empty guide', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const result = await parser({ content, date })
  expect(result).toMatchObject([])
})
