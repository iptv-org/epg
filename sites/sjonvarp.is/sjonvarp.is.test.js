// npx epg-grabber --config=sites/sjonvarp.is/sjonvarp.is.config.js --channels=sites/sjonvarp.is/sjonvarp.is.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./sjonvarp.is.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-08-28', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'RUV',
  xmltv_id: 'RUV.is'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'http://www.sjonvarp.is/index.php?Tm=%3F&p=idag&c=RUV&y=2022&m=08&d=28'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-08-28T07:15:00.000Z',
    stop: '2022-08-28T07:16:00.000Z',
    title: 'KrakkaRÚV'
  })

  expect(results[1]).toMatchObject({
    start: '2022-08-28T07:16:00.000Z',
    stop: '2022-08-28T07:21:00.000Z',
    title: 'Tölukubbar',
    description: 'Lærið um tölustafina með Tölukubbunum! e.'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const result = parser({ content, date })
  expect(result).toMatchObject([])
})
