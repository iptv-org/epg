// npx epg-grabber --config=sites/ruv.is/ruv.is.config.js --channels=sites/ruv.is/ruv.is.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./ruv.is.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-12-03', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'ruv',
  xmltv_id: 'RUV.is'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.ruv.is/sjonvarp/dagskra/ruv/2022-12-03')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  let results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-12-03T07:05:00.000Z',
    stop: '2022-12-03T07:15:00.000Z',
    title: `Smástund`,
    description:
      'Smástund hentar vel fyrir þau allra yngstu, í hverjum þætti lærum við orð, liti, tölur og tónlist. e.',
    icon: 'https://d38kdhuogyllre.cloudfront.net/fit-in/480x/filters:quality(65)/hd_posters/a2kmk0-mcpf0o.jpg'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  })
  expect(result).toMatchObject([])
})
