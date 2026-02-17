const { parser, url, request } = require('./sky.de.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2022-02-28', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '522',
  xmltv_id: 'WarnerTVComedyHD.de'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.sky.de/sgtvg/service/getBroadcastsForGrid')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    cil: [channel.site_id],
    d: date.valueOf()
  })
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
      title: 'King of Queens',
      description: 'Der Experte',
      category: 'Comedyserie',
      start: '2022-02-26T23:05:00.000Z',
      stop: '2022-02-26T23:30:00.000Z',
      season: '4',
      episode: '11',
      image: 'http://sky.de/static/img/program_guide/1522936_s.jpg'
    },
    {
      title: 'King of Queens',
      description: 'Speedy Gonzales',
      category: 'Comedyserie',
      start: '2022-02-26T23:30:00.000Z',
      stop: '2022-02-26T23:55:00.000Z',
      season: '4',
      episode: '12',
      image: 'http://sky.de/static/img/program_guide/1522937_s.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '[]'
  })
  expect(result).toMatchObject([])
})
