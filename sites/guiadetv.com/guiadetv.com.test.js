const { parser, url } = require('./guiadetv.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-18', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'canal-rural',
  xmltv_id: 'CanalRural.br'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.guiadetv.com/canal/canal-rural')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(16)
  expect(results[0]).toMatchObject({
    start: '2025-01-18T03:00:00.000Z',
    stop: '2025-01-18T04:00:00.000Z',
    title: 'Leilão',
    description: null,
    category: null
  })
  expect(results[2]).toMatchObject({
    start: '2025-01-18T06:00:00.000Z',
    stop: '2025-01-18T09:00:00.000Z',
    title: 'TV Verdade',
    description: null,
    category: 'Jornalismo'
  })
  expect(results[15]).toMatchObject({
    start: '2025-01-19T00:00:00.000Z',
    stop: '2025-01-19T00:30:00.000Z',
    title: 'Leilão',
    description: null,
    category: null
  })
})

it('can parse response for current day', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date: dayjs.utc('2025-01-15', 'YYYY-MM-DD').startOf('d') }).map(
    p => {
      p.start = p.start.toJSON()
      p.stop = p.stop.toJSON()
      return p
    }
  )

  expect(results.length).toBe(7)
  expect(results[0]).toMatchObject({
    start: '2025-01-15T21:15:00.000Z',
    stop: '2025-01-15T21:45:00.000Z',
    title: 'Planeta Campo Talks',
    description:
      'Grandes reportagens, notícias, entrevistas e debates com foco em ações de sustentabilidade e indicadores ESG. Informações para apoiar o produtor rural a plantar e criar com olhar para o futuro.',
    category: null
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  })

  expect(results).toMatchObject([])
})
