const { parser, url } = require('./novacyprus.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '614',
  xmltv_id: 'NovaCinema1.gr'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://www.novacyprus.com/api/v1/tvprogram/from/20211117/to/20211118'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-17T04:20:00.000Z',
      stop: '2021-11-17T06:10:00.000Z',
      title: 'Δεσμοί Αίματος',
      description: 'Θρίλερ Μυστηρίου',
      image:
        'http://cache-forthnet.secure.footprint.net/linear/3/0/305608_COMMOBLOOX_GUIDE_STILL.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
