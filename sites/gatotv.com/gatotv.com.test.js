// npm run channels:parse -- --config=./sites/gatotv.com/gatotv.com.config.js --output=./sites/gatotv.com/gatotv.com.channels.xml
// npx epg-grabber --config=sites/gatotv.com/gatotv.com.config.js --channels=sites/gatotv.com/gatotv.com.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./gatotv.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-31', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'punto_2_puerto_rico',
  xmltv_id: 'WKAQDT2.us'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.gatotv.com/canal/punto_2_puerto_rico/2023-01-31')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  const results = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-01-31T04:30:00.000Z',
    stop: '2023-01-31T05:30:00.000Z',
    title: 'Decisiones de mujeres'
  })

  expect(results[2]).toMatchObject({
    start: '2023-01-31T06:30:00.000Z',
    stop: '2023-01-31T07:30:00.000Z',
    title: 'El Señor de los Cielos',
    icon: 'https://imagenes.gatotv.com/categorias/telenovelas/miniatura/el_senor_de_los_cielos.jpg',
    description:
      'La vida de Amado Carrillo Fuentes, conocido como “El Señor de los Cielos”, uno de los cabecillas del Cuartel de Juárez.'
  })

  expect(results[33]).toMatchObject({
    start: '2023-02-01T04:30:00.000Z',
    stop: '2023-02-01T05:30:00.000Z',
    title: 'Decisiones de mujeres'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })

  expect(results).toMatchObject([])
})
