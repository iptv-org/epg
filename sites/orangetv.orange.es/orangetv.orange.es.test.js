const { parser, url } = require('./orangetv.orange.es.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)
const path = require('path')
const fs = require('fs')

const date = dayjs.utc('2024-12-01', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1010',
  xmltv_id: 'La1.es'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(`https://epg.orangetv.orange.es/epg/Smartphone_Android/1_PRO/${date.format('YYYYMMDD')}_8h_1.json`)
})

it('can parse response', async () => {
  const content =  fs.readFileSync(path.resolve(__dirname, '__data__/data.json')).toString()
  let results = await parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(4)

  var sampleResult = results[0];

  expect(sampleResult).toMatchObject({
    start: '2024-11-30T22:36:51.000Z',
    stop: '2024-11-30T23:57:25.000Z',
    category: ['Cine', 'Romance', 'Comedia', 'Comedia Romántica'],
    description: 'Charlie trabaja como director en una escuela de primaria y goza de una placentera existencia junto a sus amigos. A pesar de ello, no es feliz porque cada vez que se enamora pierde la cordura.',
    title: 'Loco de amor'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: '{}'
  })
  expect(result).toMatchObject({})
})
