// npm run channels:parse -- --config=./sites/cablego.com.pe/cablego.com.pe.config.js --output=./sites/cablego.com.pe/cablego.com.pe.channels.xml
// npx epg-grabber --config=sites/cablego.com.pe/cablego.com.pe.config.js --channels=sites/cablego.com.pe/cablego.com.pe.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./cablego.com.pe.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-11-28', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '0#LATINA',
  xmltv_id: 'Latina.pe'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://cablego.com.pe/epg/default/2022-11-28?page=0&do=loadPage'
  )
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'x-requested-with': 'XMLHttpRequest'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-28T05:00:00.000Z',
    stop: '2022-11-28T06:30:00.000Z',
    title: 'Especiales Qatar'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const result = parser({ content, channel, date })
  expect(result).toMatchObject([])
})
