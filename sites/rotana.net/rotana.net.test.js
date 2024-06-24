const { parser, url, request } = require('./rotana.net.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-12-10').startOf('d')
const channel = {
  lang: 'en',
  site_id: '439',
  xmltv_id: 'RotanaCinemaMasr.sa'
}
const channelAr = Object.assign({}, channel, { lang: 'ar' })

axios.get.mockImplementation((url, opts) => {
  if (url === 'https://rotana.net/en/streams?channel=439&itemId=239849') {
    return Promise.resolve({
      data: fs.readFileSync(path.resolve(__dirname, '__data__/program_en.html'))
    })
  }
  if (url === 'https://rotana.net/ar/streams?channel=439&itemId=239849') {
    return Promise.resolve({
      data: fs.readFileSync(path.resolve(__dirname, '__data__/program_ar.html'))
    })
  }

  return Promise.resolve({ data: '' })
})

it('can use defined user agent', () => {
  const result = request.headers['User-Agent']
  expect(result).toBe(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 OPR/104.0.0.0'
  )
})

it('can generate valid english url', () => {
  const result = url({ channel, date })
  expect(result).toBe('https://rotana.net/en/streams?channel=439&tz=')
})

it('can generate valid arabic url', () => {
  const result = url({ channel: channelAr, date })
  expect(result).toBe('https://rotana.net/ar/streams?channel=439&tz=')
})

it('can parse english response', async () => {
  const result = await parser({
    channel,
    date,
    content: fs.readFileSync(path.join(__dirname, '/__data__/content_en.html'))
  })
  expect(result[0]).toMatchObject({
    start: '2023-12-09T21:36:00.000Z',
    stop: '2023-12-09T23:46:00.000Z',
    title: 'Katkout',
    description:
      'In a comic framework, the events of the film revolve around (Katkoot) Al-Saedi, whose aunt, the eldest of the Al-Saedi family, tries to force him to kill himself in order to ransom his family. A time...',
    image: 'https://imgsrv.rotana.net/spider_storage/1398X1000/1690882129.webp?w=450&fit=max'
  })
})

it('can parse arabic response', async () => {
  const result = await parser({
    channel: channelAr,
    date,
    content: fs.readFileSync(path.join(__dirname, '/__data__/content_ar.html'))
  })
  expect(result[0]).toMatchObject({
    start: '2023-12-09T21:36:00.000Z',
    stop: '2023-12-09T23:46:00.000Z',
    title: 'كتكوت',
    description:
      'في إطار كوميدي تدور أحداث الفيلم، حول (كتكوت) الصعيدي الذي تحاول عمته كبيرة العائلة الصعيدية إجباره على تقديم نفسه للقتل ليفدي عائلته، ولكنه يهرب وتخطفه جهة أمنية لاكتشاف شبه كبير بينه وبين (يوسف خوري...',
    image: 'https://imgsrv.rotana.net/spider_storage/1398X1000/1690882129.webp?w=450&fit=max'
  })
})

it('can handle empty guide', async () => {
  const result = await parser({
    content: '<!DOCTYPE html><html><head></head><body></body></html>',
    date,
    channel
  })
  expect(result).toMatchObject([])
})
