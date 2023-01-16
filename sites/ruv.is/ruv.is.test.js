// npx epg-grabber --config=sites/ruv.is/ruv.is.config.js --channels=sites/ruv.is/ruv.is.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./ruv.is.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'ruv',
  xmltv_id: 'RUV.is'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.ruv.is/gql/?operationName=getSchedule&variables=%7B%22channel%22%3A%22ruv%22%2C%22date%22%3A%222023-01-17%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%227d133b9bd9e50127e90f2b3af1b41eb5e89cd386ed9b100b55169f395af350e6%22%7D%7D'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-01-17T13:00:00.000Z',
    stop: '2023-01-17T13:10:00.000Z',
    title: `Heimaleikfimi`,
    description:
      'Góð ráð og æfingar sem tilvalið er að gera heima. Íris Rut Garðarsdóttir sjúkraþjálfari hefur umsjón með leikfiminni. e.',
    icon: 'https://d38kdhuogyllre.cloudfront.net/fit-in/480x/filters:quality(65)/hd_posters/91pvig-3p3hig.jpg'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
