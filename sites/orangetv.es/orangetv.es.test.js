const { parser, url } = require('./orangetv.es.config.js')
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

it('can parse response', () => {
  const content =  fs.readFileSync(path.resolve(__dirname, '__data__/data.json')).toString()
  const results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(21)

  var sampleResult = results[0];

  expect(sampleResult).toMatchObject([
    {
      start: '2022-03-11T05:00:00.000Z',
      stop: '2022-03-11T07:30:00.000Z',
      category: 'Información',
      title: 'Telediario Matinal'
    },
    {
      start: '2022-03-11T21:15:00.000Z',
      stop: '2022-03-11T23:30:00.000Z',
      category: 'Información',
      title: 'Las Claves del Siglo XXI: Episodio 8'
    },
    {
      start: '2022-03-12T02:10:00.000Z',
      stop: '2022-03-12T05:00:00.000Z',
      category: 'Información',
      title: 'Noticias 24H'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: '[]'
  })
  expect(result).toMatchObject([])
})
