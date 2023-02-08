// npm run channels:parse -- --config=./sites/cableplus.com.uy/cableplus.com.uy.config.js --output=./sites/cableplus.com.uy/cableplus.com.uy.channels.xml
// npx epg-grabber --config=sites/cableplus.com.uy/cableplus.com.uy.config.js --channels=sites/cableplus.com.uy/cableplus.com.uy.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./cableplus.com.uy.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-02-12', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2035',
  xmltv_id: 'APlusV.uy'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.reportv.com.ar/finder/channel')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  })
})

it('can generate valid request data', () => {
  const params = request.data({ date, channel })

  expect(params.get('idAlineacion')).toBe('3017')
  expect(params.get('idSenial')).toBe('2035')
  expect(params.get('fecha')).toBe('2023-02-12')
  expect(params.get('hora')).toBe('00:00')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(21)

  expect(results[0]).toMatchObject({
    start: '2023-02-12T09:30:00.000Z',
    stop: '2023-02-12T10:30:00.000Z',
    title: `Revista agropecuaria`,
    icon: 'https://www.reportv.com.ar/buscador/img/Programas/2797844.jpg',
    categories: []
  })

  expect(results[4]).toMatchObject({
    start: '2023-02-12T12:30:00.000Z',
    stop: '2023-02-12T13:30:00.000Z',
    title: `De pago en pago`,
    icon: 'https://www.reportv.com.ar/buscador/img/Programas/3772835.jpg',
    categories: ['Cultural']
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
