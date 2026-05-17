const { parser, url, request } = require('./osn.com.config')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-05-16').startOf('d')
const channelAR = { site_id: '4506', xmltv_id: 'OSNKids.ae@SD', lang: 'ar' }
const channelEN = { site_id: '4506', xmltv_id: 'OSNKids.ae@SD', lang: 'en' }
const content = fs.readFileSync(path.join(__dirname, '/__data__/content.json'))

it('can generate valid request headers', () => {
  const result = request.headers({ channel: channelAR, date })
  expect(result).toMatchObject({
    'X-Encrypted-Data':
      'e0srp4UFarSGxZt4iWaXSZTCg6vB46NRZmY5V9wEzxHeB1bwR1HXrAuTI8FCVH7i3+uVqkDQSgRxjRFPYdrXhqedzEogwcjDnjRPmLtFxEA='
  })
})

it('can generate valid url', () => {
  const result = url({ channel: channelAR, date })
  expect(result).toBe(
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch1-time1778846400000-1778932800000-boxAndroid'
  )
})

it('can parse response (ar)', () => {
  const result = parser({ date, channel: channelAR, content })
    .map(a => {
      a.start = a.start.toJSON()
      a.stop = a.stop.toJSON()
      return a
    })

  expect(result.length).toBe(105)
  expect(result[104]).toMatchObject({
    start: '2026-05-16T11:50:00.000Z',
    stop: '2026-05-16T12:14:00.000Z',
    title: 'ميكس ماستر',
    subTitle: 'سيكريت إيجنت وولفمان!',
    description:
      'يبدأ وولفمان، أحد أعضاء مجلس الشيوخ في أتريا، تحقيقًا في لغز ظهور أساتذة المزج المظلم في بلدة غيمبريدج.',
    categories: ['رسوم متحركة', 'مغامرات'],
    season: 2,
    episode: 23,
    date: '2010'
  })
})

it('can parse response (en)', () => {
  const result = parser({ date, channel: channelEN, content })
    .map(a => {
      a.start = a.start.toJSON()
      a.stop = a.stop.toJSON()
      return a
    })

  expect(result.length).toBe(105)
  expect(result[104]).toMatchObject({
    start: '2026-05-16T11:50:00.000Z',
    stop: '2026-05-16T12:14:00.000Z',
    title: 'Mix Master',
    subTitle: 'Secret Agent Wolfman!',
    description:
      'Wolfman, one of the members of council of elders in Atreia, starts an investigation into the mystery of the appearances of Dark Mix Masters in Gamebridge Town.',
    categories: ['Animation', 'Adventure'],
    season: 2,
    episode: 23,
    date: '2010'
  })
})

it('can handle empty guide', () => {
  const result = parser({ date, channel: channelAR, content: '[]' })
  expect(result).toMatchObject([])
})
