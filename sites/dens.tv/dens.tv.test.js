// npm run channels:parse -- --config=./sites/dens.tv/dens.tv.config.js --output=./sites/dens.tv/dens.tv.channels.xml
// npm run grab -- --site=dens.tv

const { url, parser } = require('./dens.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2023-11-10', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '6', xmltv_id: 'MetroTV.id', lang: 'id' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.dens.tv/tvpage_octo/epgchannel2/2023-11-10/6')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(26)

  expect(results[0]).toMatchObject({
    start: '2023-11-09T17:00:00.000Z',
    stop: '2023-11-09T17:05:00.000Z',
    title: 'Follow Up'
  })

  expect(results[12]).toMatchObject({
    start: '2023-11-10T04:05:00.000Z',
    stop: '2023-11-10T06:05:00.000Z',
    title: 'Metro Siang'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content })

  expect(results).toMatchObject([])
})
