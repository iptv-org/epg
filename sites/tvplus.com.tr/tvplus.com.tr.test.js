const { parser, url } = require('./tvplus.com.tr.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2024-12-15', 'YYYY-MM-DD').startOf('d')
const channel = {
  lang: 'tr',
  site_id: 'nick-jr/4353',
  xmltv_id: 'NickJr.tr'
}

axios.get.mockImplementation(url => {
  if (url === 'https://tvplus.com.tr/canli-tv/yayin-akisi') {
    return Promise.resolve({
      data: fs.readFileSync(path.join(__dirname, '__data__', 'build.html')).toString()
    })
  }
})

it('can generate valid url', async () => {
  expect(await url({ channel })).toBe(
    'https://tvplus.com.tr/_next/data/kUzvz_bbQJNaShlFUkrR3/tr/canli-tv/yayin-akisi/nick-jr--4353.json?title=nick-jr--4353'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.json'))
  const results = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(88)
  expect(results[0]).toMatchObject({
    start: '2024-12-14T21:10:00.000Z',
    stop: '2024-12-14T21:20:00.000Z',
    title: 'Camgöz (2020)',
    description:
      "Max'in Camgöz adında yarı köpek balığı yarı köpek eşsiz bir evcil havyanı vardır. İlk başlarda Camgöz'ü saklamaya çalışsa da Sisli Pınarlar'da, en iyi arkadaşlar, meraklı komşular ve hatta Max'in ailesi bile yaramaz yeni arkadaşını fark edecektir.",
    image:
      'https://gbzeottvsc01.tvplus.com.tr:33207/CPS/images/universal/film/program/202412/20241209/21/2126356250845eb88428_0_XL.jpg',
    category: 'Çocuk',
    season: 1,
    episode: 116
  })
  expect(results[10]).toMatchObject({
    start: '2024-12-14T23:00:00.000Z',
    stop: '2024-12-14T23:25:00.000Z',
    title: 'Blaze ve Yol Canavarları',
    description:
      'Blaze ve Yol Canavarları, dünyanın en büyük canavar kamyonu Blaze ve en iyi arkadaşı ve sürücüsü AJ adında bir çocuk hakkındaki interaktif bir anaokulu animasyon dizisidir.',
    image:
      'https://gbzeottvsc01.tvplus.com.tr:33207/CPS/images/universal/film/program/202412/20241209/94/2126356271145eb88428_0_XL.jpg',
    category: 'Çocuk',
    season: 6,
    episode: 617
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: ''
  })
  expect(result).toMatchObject([])
})
