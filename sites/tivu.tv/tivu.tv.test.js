// npx epg-grabber --config=sites/tivu.tv/tivu.tv.config.js --channels=sites/tivu.tv/tivu.tv.channels.xml --output=guide.xml

const { parser, url, request } = require('./tivu.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)
const axios = require('axios')
jest.mock('axios')

const channel = {
  site_id: '62',
  xmltv_id: 'Rai1HD.it'
}

it('can generate valid url for today', () => {
  const date = dayjs.utc().startOf('d')
  expect(url({ date })).toBe('https://www.tivu.tv/epg_ajax_sat.aspx?d=0')
})

it('can generate valid url for tomorrow', () => {
  const date = dayjs.utc().startOf('d').add(1, 'd')
  expect(url({ date })).toBe('https://www.tivu.tv/epg_ajax_sat.aspx?d=1')
})

it('can parse response', () => {
  const date = dayjs.utc('2022-10-04', 'YYYY-MM-DD').startOf('d')
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  let results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-10-03T22:02:00.000Z',
    stop: '2022-10-03T22:45:00.000Z',
    title: 'Cose Nostre - La figlia del boss'
  })

  expect(results[43]).toMatchObject({
    start: '2022-10-05T04:58:00.000Z',
    stop: '2022-10-05T05:28:00.000Z',
    title: 'Tgunomattina - in collaborazione con day'
  })
})

it('can handle empty guide', () => {
  const date = dayjs.utc('2022-10-04', 'YYYY-MM-DD').startOf('d')
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const result = parser({ content, channel, date })
  expect(result).toMatchObject([])
})
