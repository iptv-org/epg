// npm run grab -- --site=rotana.net

const { parser, url, request } = require('./rotana.net.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-11-11').startOf('d')
const channel = {
  lang: 'en',
  site_id: '640688871275c9aaa905902a',
  xmltv_id: 'RotanaCinemaMasr.sa'
}
const channelAr = {
  lang: 'ar',
  site_id: '640688871275c9aaa905902a',
  xmltv_id: 'RotanaCinemaMasr.sa'
}

it('can use defined user agent', () => {
  const result = request.headers['User-Agent']
  expect(result).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 OPR/104.0.0.0')
})

it('can generate valid english url', () => {
  const result = url({ channel, date })
  expect(result).toBe('https://rotana.net/en/streams?channel=640688871275c9aaa905902a')
})

it('can generate valid arabic url', () => {
  const result = url({ channel: channelAr, date })
  expect(result).toBe('https://rotana.net/ar/streams?channel=640688871275c9aaa905902a')
})

it('can parse english response', () => {
  const fs = require('fs')
  const path = require('path')

  const result = parser({ channel, date, content: fs.readFileSync(path.join(__dirname, '/__data__/content_en.html'))})
  expect(result).toMatchObject([
    {
      start: '2023-11-10T23:00:00.000Z',
      stop: '2023-11-11T01:00:00.000Z',
      title: 'Harim Karim',
      description: 'Karim and Jihan separate after a year of marriage due to her discovering his betrayal in her home. Karim tries to get his wife back, but she refuses. Karim calls his old colleague Maha to help him. Ho...'
    }
  ])
})

it('can parse arabic response', () => {
  const fs = require('fs')
  const path = require('path')

  const result = parser({ channelAr, date, content: fs.readFileSync(path.join(__dirname, '/__data__/content_ar.html'))})
  expect(result).toMatchObject([
    {
      start: '2023-11-10T23:00:00.000Z',
      stop: '2023-11-11T01:00:00.000Z',
      title: 'حريم كريم',
      description: 'كريم وجيهان ينفصلا بعد عام من الزواج بسبب اكتشافها لخيانته في منزلها، يحاول كريم استعادة زوجته، لكنها ترفض، فيتصل كريم بزميلته القديمة مها، لتساعده، لكن متاعب تحدث بين مها وزوجها، فتأتي لتعيش مع كريم،...'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '<!DOCTYPE html><html><head></head><body></body></html>',
    date,
    channel
  })
  expect(result).toMatchObject([])
})
