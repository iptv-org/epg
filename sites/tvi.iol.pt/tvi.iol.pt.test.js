const { parser, url } = require('./tvi.iol.pt.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-26', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'tvi', xmltv_id: 'TVI.pt' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://tvi.iol.pt/emissao/dia/tvi?data=2025-01-26')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(16)
  expect(results[0]).toMatchObject({
    title: 'As aventuras do Gato das Botas',
    description: null,
    icon: 'https://img.iol.pt/image/id/66d6fb1ad34e94b82904c3ce/300.jpg',
    start: '2025-01-26T05:15:00.000Z',
    stop: '2025-01-26T05:45:00.000Z'
  })
  expect(results[5]).toMatchObject({
    title: 'Missa',
    description: 'Gondomar',
    icon: 'https://img.iol.pt/image/id/6218de030cf21a10a4218ba3/300.jpg',
    start: '2025-01-26T09:00:00.000Z',
    stop: '2025-01-26T10:00:00.000Z'
  })
  expect(results[7]).toMatchObject({
    title: 'Por um Triz',
    description: 'Um segundo pode mudar tudo.',
    icon: 'https://img.iol.pt/image/id/6777dcffd34e94b829094756/300.jpg',
    start: '2025-01-26T11:00:00.000Z',
    stop: '2025-01-26T11:58:00.000Z'
  })
  expect(results[15]).toMatchObject({
    title: 'As aventuras do Gato das Botas',
    description: null,
    icon: 'https://img.iol.pt/image/id/66d6fb1ad34e94b82904c3ce/300.jpg',
    start: '2025-01-27T04:50:00.000Z',
    stop: '2025-01-27T05:20:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  })

  expect(results).toMatchObject([])
})
