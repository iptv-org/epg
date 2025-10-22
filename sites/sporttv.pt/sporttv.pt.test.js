const { parser, url } = require('./sporttv.pt.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-23', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 727,
  xmltv_id: 'SportTV1.pt'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.sporttv.pt/guia')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(19)

  expect(results[0]).toMatchObject({
    start: '2024-12-23T01:00:00.000Z',
    stop: '2024-12-23T01:30:00.000Z',
    description: 'LIGA PORTUGAL BETCLIC',
    category: 'FUTEBOL',
    title: 'RESUMOS DA JORNADA 15',
    image: 'https://www.sporttv.pt/default/0001/11/08cb25f0b9b427e0bb83179309074632410f536b.jpg'
  })

  expect(results[1]).toMatchObject({
    start: '2024-12-23T01:30:00.000Z',
    stop: '2024-12-23T02:00:00.000Z',
    description: 'LIGA ITALIANA',
    category: 'FUTEBOL',
    title: 'RESUMOS DA JORNADA 17',
    image:
      'https://www.sporttv.pt/cms_media/default/0001/11/56ab6bb72a00c8a9543eff35f90f57c07fb0ff87.jpg'
  })
})

it('can handle empty guide', () => {
  const content = ''
  const result = parser({ content, date })
  expect(result).toMatchObject([])
})
