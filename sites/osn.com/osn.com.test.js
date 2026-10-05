const { parser, url, request } = require('./osn.com.config')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2026-05-16').startOf('d')
const channelAR = { site_id: '4506', xmltv_id: 'OSNKids.ae@SD', lang: 'ar' }
const channelEN = { site_id: '4506', xmltv_id: 'OSNKids.ae@SD', lang: 'en' }
const content = fs.readFileSync(path.join(__dirname, '/__data__/content.json'))

axios.get.mockImplementation(url => {
  const urls = {
    'https://www.osn.com/apidata/channels?platform=Android': 'channel.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch1-time1778846400000-1778932800000-boxAndroid': 'content.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch2-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch3-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch4-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch5-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch6-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch7-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch8-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch9-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch10-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch11-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch12-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch13-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch14-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch15-time1778846400000-1778932800000-boxAndroid': 'empty.json',
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch16-time1778846400000-1778932800000-boxAndroid': 'empty.json'
  }
  let data = ''
  if (urls[url] !== undefined) {
    data = fs.readFileSync(path.join(__dirname, '__data__', urls[url])).toString()
  }
  return Promise.resolve({ data })
})

it('can generate valid request headers', async () => {
  const result = await request.headers({ date })
  expect(result).toMatchObject({
    'X-Encrypted-Data':
      'e0srp4UFarSGxZt4iWaXSSZCApUQYlb/CPhOH0/r/rUzyU/aVEst9+dVQueAwTe3A/or1iCzDEaiVfQ/VTxF9ZdIzOZeb3SSRap3YK7IFkj7Km6L8aXxpsNeQua/L/Ar'
  })
})

it('can generate valid url', async () => {
  const result = await url({ date })
  expect(result).toBe(
    'https://www.osn.com/apidata/tv-schedule-timeline?t=batch1-time1778846400000-1778932800000-boxAndroid'
  )
})

it('can parse response (ar)', async () => {
  const result = (await parser({ date, channel: channelAR, content }))
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

it('can parse response (en)', async () => {
  const result = (await parser({ date, channel: channelEN, content }))
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

it('can handle empty guide', async () => {
  const result = await parser({ date, channel: channelAR, content: '[]' })
  expect(result).toMatchObject([])
})
