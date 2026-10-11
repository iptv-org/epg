const { parser, url } = require('./sporttv.pt.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-06-08', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 727,
  xmltv_id: 'SportTV1.pt'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(`https://www.sporttv.pt/api/channels/epg?dataInicio=${date.format('DD/MM/YYYY%20HH:mm')}&dataFim=${date.add(1, 'day').format('DD/MM/YYYY%20HH:mm')}&tipoMedia=thumbnail&idCanal=${channel.site_id}`)
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf-8')
  const results = parser({ content, date, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(7)

  expect(results[0]).toMatchObject({
    start: '2026-06-08T00:59:54.000Z',
    stop: '2026-06-08T03:00:21.000Z',
    description: 'JOGOS PREPARAÇÃO MUNDIAL - FUTEBOL',
    category: 'FUTEBOL',
    title: 'CROÁCIA X ESLOVÉNIA',
    image: 'https://www.sporttv.pt/default/0001/11/175ab04d3ec614f86ec6771823b7921f137d2c91.jpg'
  })

  expect(results[1]).toMatchObject({
    start: '2026-06-08T03:00:21.000Z',
    stop: '2026-06-08T03:54:56.000Z',
    description: 'LIGA ITALIANA 2025/2026 - HIGHLIGHTS - FUTEBOL',
    category: 'FUTEBOL',
    title: 'RESUMO DA ÉPOCA',
    image:
      'https://www.sporttv.pt/default/0001/11/72f8a4f9569763b7dfdce68dbac3b33024e34b26.jpg'
  })
})

it('can handle empty guide', () => {
  const content = []
  const result = parser({ content, date })
  expect(result).toMatchObject([])
})
