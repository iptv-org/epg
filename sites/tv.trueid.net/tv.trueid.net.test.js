const { parser, url } = require('./tv.trueid.net.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-12-11').startOf('d')
const channel = {
  lang: 'en',
  site_id: 'true-movie-hits',
  xmltv_id: 'TrueMovieHits.th'
}
const channelTh = Object.assign({}, channel, { lang: 'th' })
const data = fs.readFileSync(path.resolve(__dirname, '__data__/data.json'))

it('can generate valid url', () => {
  const result = url({ channel, date })
  expect(result).toBe(
    'https://tv.trueid.net/_next/data/1380644e0f1fb6b14c82894a0c682d147e015c9d/th-en.json?channelSlug=true-movie-hits&path=true-movie-hits'
  )
})

it('can parse English response', () => {
  const result = parser({ date, channel, content: data }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(result[0]).toMatchObject({
    start: '2023-12-11T19:05:00.000Z',
    stop: '2023-12-11T20:55:00.000Z',
    title: 'The Last Witch Hunter',
    description:
      'A young man is all that stands between humanity and the most horrifying witches in history.',
    image: 'https://bms.dmpcdn.com/uploads/pic/381f853da5f4a310bf248357fed21a57.jpg'
  })
})

it('can parse Thai response', () => {
  const result = parser({ date, channel: channelTh, content: data }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(result[0]).toMatchObject({
    start: '2023-12-11T19:05:00.000Z',
    stop: '2023-12-11T20:55:00.000Z',
    title: 'The Last Witch Hunter',
    description:
      'หนุ่มนักล่าแม่มดถูกสาปให้เป็นอมตะจนกระทั่งราชินีแม่มดได้ฟื้นคืนชีพขึ้นมาจึงมีเพียงเขาคนเดียวเท่านั้นที่จะสามารถกอบกู้มวลมนุษยชาติได้',
    image: 'https://bms.dmpcdn.com/uploads/pic/381f853da5f4a310bf248357fed21a57.jpg'
  })
})

it('can handle empty guide', () => {
  const result = parser({ date, channel, content: '{}' })
  expect(result).toMatchObject([])
})
