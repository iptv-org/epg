const { parser, url, request } = require('./osn.com.config')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-11-27', 'YYYY-MM-DD').startOf('d')
const channelAR = { site_id: 'FTF', xmltv_id: 'Fatafeat.ae', lang: 'ar' }
const channelEN = { site_id: 'FTF', xmltv_id: 'Fatafeat.ae', lang: 'en' }
const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.json'))

it('can generate valid request headers', () => {
  const result = request.headers({ channel: channelAR, date })
  expect(result).toMatchObject({
    Referer: 'https://www.osn.com/ar-ae/watch/tv-schedule'
  })
})

it('can generate valid url', () => {
  const result = url({ channel: channelAR, date })
  expect(result).toBe(
    'https://www.osn.com/api/TVScheduleWebService.asmx/time?dt=11%2F27%2F2024&co=AE&ch=FTF&mo=false&hr=0'
  )
})

it('can parse response (ar)', () => {
  const result = parser({ date, channel: channelAR, content }).map(a => {
    a.start = a.start.toJSON()
    a.stop = a.stop.toJSON()
    return a
  })
  expect(result.length).toBe(29)
  expect(result[1]).toMatchObject({
    start: '2024-11-26T20:50:00.000Z',
    stop: '2024-11-26T21:45:00.000Z',
    title: 'بيت الحلويات: الحلقة 3'
  })
})

it('can parse response (en)', () => {
  const result = parser({ date, channel: channelEN, content }).map(a => {
    a.start = a.start.toJSON()
    a.stop = a.stop.toJSON()
    return a
  })
  expect(result.length).toBe(29)
  expect(result[1]).toMatchObject({
    start: '2024-11-26T20:50:00.000Z',
    stop: '2024-11-26T21:45:00.000Z',
    title: 'House Of Desserts: Episode 3'
  })
})

it('can handle empty guide', () => {
  const result = parser({ date, channel: channelAR, content: '[]' })
  expect(result).toMatchObject([])
})
