const { parser, url } = require('./orangetv.orange.es.config.js')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2026-05-29').startOf('d')
const channel = {
  site_id: '1010',
  xmltv_id: 'La1.es'
}

axios.get.mockImplementation(url => {
  const result = {}
  const urls = {
    'https://epg.orangetv.orange.es/epg/SmartTV_Android/1_PRO/20260529_8h_1.json':
      'data1.json',
    'https://epg.orangetv.orange.es/epg/SmartTV_Android/1_PRO/20260529_8h_2.json':
      'data2.json',
    'https://epg.orangetv.orange.es/epg/SmartTV_Android/1_PRO/20260529_8h_3.json':
      'data3.json',
  }
  if (urls[url] !== undefined) {
    result.data = fs.readFileSync(path.join(__dirname, '__data__', urls[url])).toString()
    if (!urls[url].startsWith('data1')) {
      result.data = JSON.parse(result.data)
    }
  }

  return Promise.resolve(result)
})

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://epg.orangetv.orange.es/epg/SmartTV_Android/1_PRO/20260529_8h_1.json'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'data1.json')).toString()
  const results = (await parser({ content, channel, date })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(21)
  expect(results[0]).toMatchObject({
    start: '2026-05-28T21:23:54.000Z',
    stop: '2026-05-28T23:06:22.000Z',
    title: 'Llenos de gracia',
    description:
      'Marina es una monja atípica, recién llegada a El Parral, un colegio con niños problemáticos. A pesar de que los internos, niños sin familia, la reciben con mil trastadas, poco a poco se crearán entre ellos vínculos casi familiares.',
    category: ['Cine', 'Comedia', 'Familiar'],
    icon: 'https://pc.orangetv.orange.es/pc/api/rtv/v1/images/epg/COVER/COVER_4609317.jpg'
  })
  expect(results[18]).toMatchObject({
    start: '2026-05-29T18:55:00.000Z',
    stop: '2026-05-29T19:45:00.000Z',
    title: 'Telediario 2 - T2026, E149: 29 de Mayo de 2026',
    sub_title: 'Telediario 2',
    description:
      'Programa de noticias diarias nacionales e internacionales en directo.',
    category: ['Programa', 'Informativo'],
    icon: 'https://pc.orangetv.orange.es/pc/api/rtv/v1/images/epg/COVER/COVER_4301953.jpg',
    season: 2026,
    episode: 149
  })
})

it('can handle empty guide', async () => {
  const result = await parser({
    date,
    channel,
    content: '{}'
  })
  expect(result).toMatchObject({})
})
