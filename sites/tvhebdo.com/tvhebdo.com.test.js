// npm run channels:parse -- --config=./sites/tvhebdo.com/tvhebdo.com.config.js --output=./sites/tvhebdo.com/tvhebdo.com.channels.xml
// npx epg-grabber --config=sites/tvhebdo.com/tvhebdo.com.config.js --channels=sites/tvhebdo.com/tvhebdo.com.channels.xml --output=guide.xml

const { parser, url } = require('./tvhebdo.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-05-11', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'src/CBFT',
  xmltv_id: 'CBFT.ca'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.tvhebdo.com/horaire-tele/src/CBFT/date/2022-05-11'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve('sites/tvhebdo.com/__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-05-11T15:30:00.000Z',
    stop: '2022-05-11T16:00:00.000Z',
    title: '5 chefs dans ma cuisine'
  })

  expect(results[16]).toMatchObject({
    start: '2022-05-12T04:09:00.000Z',
    stop: '2022-05-12T05:19:00.000Z',
    title: 'Outlander: Le chardon et le tartan'
  })

  expect(results[36]).toMatchObject({
    start: '2022-05-12T15:00:00.000Z',
    stop: '2022-05-12T15:30:00.000Z',
    title: 'Ricardo'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve('sites/tvhebdo.com/__data__/no_content.html'))
  const result = parser({ content, date })
  expect(result).toMatchObject([])
})
