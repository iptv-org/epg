const { parser, url } = require('./claro.com.br.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-08-13', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '1_1682' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://programacao.claro.com.br/gatekeeper/exibicao/select?q=id_revel:(1_1682)+AND+id_cidade:1&wt=json&rows=100000&start=0&sort=id_canal+asc,dh_inicio+asc&fl=dh_fim+dh_inicio+st_titulo+titulo+id_programa+id_canal+id_cidade&fq=dh_inicio:[2025-8-13T00:00:00Z+TO+2025-8-13T23:59:00Z]'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(23)
  expect(results[0]).toMatchObject({
    title: 'Encontro Com a Autora',
    start: '2025-08-13T03:00:00.000Z',
    stop: '2025-08-13T04:00:00.000Z'
  })
  expect(results[22]).toMatchObject({
    title: 'Palavra Aberta',
    start: '2025-08-14T02:30:00.000Z',
    stop: '2025-08-14T03:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content })

  expect(results).toMatchObject([])
})
