// npx epg-grabber --config=sites/compulms.com/compulms.com.config.js --channels=sites/compulms.com/compulms.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./compulms.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-11-29', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'EnerGeek Retro',
  xmltv_id: 'EnerGeekRetro.cl'
}

it('can generate valid url', () => {
  expect(url).toBe('https://raw.githubusercontent.com/luisms123/tdt/master/guiaenergeek.xml')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.xml'))
  let results = parser({ content, channel, date })

  expect(results[0]).toMatchObject({
    start: '2022-11-29T03:00:00.000Z',
    stop: '2022-11-29T03:30:00.000Z',
    title: 'Noir',
    description:
      'Kirika Yuumura es una adolescente japonesa que no recuerda nada de su pasado, salvo la palabra NOIR, por lo que decidirá contactar con Mireille Bouquet, una asesina profesional para que la ayude a investigar. Ambas forman un equipo muy eficiente, que resuelve un trabajo tras otro con gran éxito, hasta que aparece un grupo conocido como "Les Soldats", relacionados con el pasado de Kirika. Estos tratarán de eliminar a las dos chicas, antes de que indaguen más hondo sobre la verdad acerca de Noir',
    icon: 'https://pics.filmaffinity.com/nowaru_noir_tv_series-225888552-mmed.jpg'
  })
})

it('can handle empty guide', () => {
  const result = parser({ content: '', channel, date })
  expect(result).toMatchObject([])
})
