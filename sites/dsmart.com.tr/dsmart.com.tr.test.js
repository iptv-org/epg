const { parser, url } = require('./dsmart.com.tr.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const fs = require('fs')
const path = require('path')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2025-01-13', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '5fe07f5dcfef0b1593275822',
  xmltv_id: 'Sinema1001.tr'
}

axios.get.mockImplementation(url => {
  const result = {}
  const urls = {
    'https://www.dsmart.com.tr/api/v1/public/epg/schedules?page=1&limit=10&day=2025-01-13':
      'content1.json',
    'https://www.dsmart.com.tr/api/v1/public/epg/schedules?page=2&limit=10&day=2025-01-13':
      'content2.json',
  }
  if (urls[url] !== undefined) {
    result.data = fs.readFileSync(path.join(__dirname, '__data__', urls[url])).toString()
    if (!urls[url].startsWith('content1')) {
      result.data = JSON.parse(result.data)
    }
  }

  return Promise.resolve(result)
})


it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://www.dsmart.com.tr/api/v1/public/epg/schedules?page=1&limit=10&day=2025-01-13'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content1.json')).toString()
  const results = (await parser({ content, channel, date })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(11)

  expect(results[0]).toMatchObject({
    start: '2025-01-12T21:30:00.000Z',
    stop: '2025-01-12T23:30:00.000Z',
    title: 'Taksi Şoförü',
    description:
      'Vietnam savaşının izlerinin etkisindeki bir asker ve New York sokakları. Travis Bickle, geceleri taksi şoförlüğü yaptığı New York’ta bir yandan da gündelik yaşama ayak uydurmaya çalışır. Çürümeye yüz tutmuş bir topluma karşı tutulan bir ayna niteliğindeki film, yönetmen Martin Scorsese’nin kariyerinin en önemli filmlerinden biri olarak kabul görür.',
    category: ['Sinema', 'Genel']
  })
  expect(results[10]).toMatchObject({
    start: '2025-01-13T19:00:00.000Z',
    stop: '2025-01-13T21:00:00.000Z',
    title: 'Senin Adın',
    description:
      'Dağların sardığı bir bölgede yaşayan Mitsuha, hayatından çok da memnun olmayan liseli bir kızdır. Babası vali olarak çalışmakta ve seçim kampanyaları ile uğraşmaktadır. Evde kendisi, kardeşi ve büyükannesi dışında kimse yoktur. Kırsal kesimdeki yaşamı onu bunaltmaktadır ve esas isteği Tokyo\'nun muhteşem şehir hayatının bir parçası olmaktır. Diğer tarafta ise Taki vardır.',
    category: ['Sinema', 'Genel']
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    channel,
    date,
    content: fs.readFileSync(path.join(__dirname, '__data__', 'no_content.json')).toString(),
    useCache: false
  })

  expect(results).toMatchObject([])
})
